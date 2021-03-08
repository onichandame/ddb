import { Storage } from './storage';

type Data<T> = null | string | number | Set<T> | Array<T>;

export class Engine<T = any> {
  private _storage: Storage;
  private _cache: { [key: string]: Data<T> };
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
    const cache = this._cache[key];
    if (!cache) {
      const data = await this._storage.data.get(key);
      if (!data) {
        this._cache[key] = null;
      } else {
        switch (data.type) {
          case `primitive`:
            this._cache[key] = null;
            const heads: typeof data['history'][number][] = [];
            data.history.forEach(val => {
              const previous = heads.find(
                head => head.hash === val.previousNode
              );
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
            const cache = new Set<any>();
            data.history.forEach(record => {
              const [act, val] = record.action.split(` `).filter(val => !!val);
              switch (act) {
                case `ADD`:
                  cache.add(val);
                  break;
                case `DEL`:
                  cache.delete(val);
                  break;
              }
            });
            this._cache[key] = cache;
            break;
        }
      }
    }
    return this._cache[key];
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
}
