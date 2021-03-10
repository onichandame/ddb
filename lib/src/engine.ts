import { HistoryRecord, Storage } from './storage';
import { createUid } from './utils';

type PrimitiveData = string | number;

type Data<TSet> = null | PrimitiveData | Set<TSet> | Array<TSet>;

export class Engine<TSet = any> {
  private _storage: Storage;
  private _cache: { [key: string]: Data<TSet> };
  private _creator: string;
  private _initiated = false;
  constructor(name: string, creator: string) {
    this._storage = new Storage(name);
    this._cache = {};
    this._creator = creator;
  }

  private checkInit() {
    if (!this._initiated) throw new Error(`Engine not initiated!`);
  }

  private async loadValue(key: string): Promise<Engine['_cache'][string]> {
    this.checkInit();
    const data = await this._storage.data.get(key);
    if (!data) {
      this._cache[key] = null;
    } else {
      switch (data.type) {
        case `primitive`:
          this._cache[key] = null;
          const heads: typeof data['history'][number][] = [];
          data.history.forEach(val => {
            const previous = heads.find(head => head.hash === val.previousNode);
            if (previous) heads[heads.indexOf(previous)] = val;
            else heads.push(val);
          });
          if (heads.length) {
            let winningHead = heads[0];
            heads.forEach(head => {
              if (head.lamportClock > winningHead.lamportClock)
                winningHead = head;
              else if (
                head.createdAt.getTime() - winningHead.createdAt.getTime() >
                0
              )
                winningHead = head;
              else if (head.hash > winningHead.hash) winningHead = head;
            });
            this._cache[key] = winningHead.action;
          }
          break;
        case `set`:
          // each record: ACTION ELEMENT
          const caches = new Map<any, { lamportClock: number; date: Date }>();
          const tombs: typeof caches = new Map();
          data.history.forEach(record => {
            const [act, val] = record.action.split(` `).filter(val => !!val);
            switch (act) {
              case `ADD`:
                const cachedVal = caches.get(val);
                if (
                  !cachedVal ||
                  cachedVal.lamportClock < record.lamportClock ||
                  cachedVal.date.getTime() < record.createdAt.getTime()
                )
                  caches.set(val, {
                    lamportClock: record.lamportClock,
                    date: record.createdAt,
                  });
                break;
              case `DEL`:
                const cachedTomb = tombs.get(val);
                if (
                  !cachedTomb ||
                  cachedTomb.lamportClock < record.lamportClock ||
                  cachedTomb.date.getTime() < record.createdAt.getTime()
                )
                  tombs.set(val, {
                    lamportClock: record.lamportClock,
                    date: record.createdAt,
                  });
                break;
            }
          });
          const isElementKept = (val: any) => {
            const tomb = tombs.get(val);
            const cache = caches.get(val);
            return (
              cache &&
              (!tomb ||
                tomb.lamportClock < cache.lamportClock ||
                tomb.date.getTime() < cache.date.getTime())
            );
          };
          const cache = new Set<any>();
          caches.forEach((_, key) => {
            if (isElementKept(key)) cache.add(key);
          });
          this._cache[key] = cache;
          break;
      }
    }
    return this._cache[key];
  }

  private isPrimitiveData(val: Data<TSet>): val is PrimitiveData {
    return typeof val === `string` || typeof val === `number`;
  }

  async init() {
    await this._storage.creator.clear();
    await this._storage.creator.put(this._creator);
    this._initiated = true;
  }

  async get(key: string) {
    let cachedVal = this._cache[key];
    if (!cachedVal) cachedVal = await this.loadValue(key);
    return cachedVal;
  }

  async set(key: string, val: Data<TSet>) {
    if (!this.isPrimitiveData(val))
      throw new Error(`only primitive data(string or number) can be set!`);
    const existingVal = await this.get(key);
    if (existingVal) {
      if (!this.isPrimitiveData(existingVal))
        throw new Error(`non-primitive value cannot be set!`);
    } else {
      const history: Omit<HistoryRecord, 'hash'> = {
        lamportClock: 0,
        createdAt: new Date(),
        action: val.toString(),
      };
      // TODO
      const hash = this._storage.data.put({
        type: 'primitive',
        id: createUid(),
        history: [
          {
            lamportClock: 0,
            createdAt: new Date(),
            action: val.toString(),
            hash,
          },
        ],
      });
    }
  }
}
