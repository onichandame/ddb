import { createHash } from '../utils';

export class Record {
  private _hashPromise: Promise<string>;

  action: string;
  createdAt: Date;
  lamportClock: number;
  previousRecord?: Record;
  constructor(action: string, previousRecord?: Record) {
    this.action = action;
    this.createdAt = new Date();
    this.lamportClock = previousRecord?.lamportClock || -1 + 1;
    this.previousRecord = previousRecord;
    const preparePayloadForHash = () =>
      [this.action, this.lamportClock, this.createdAt.getTime()].join(`:`);
    this._hashPromise = createHash(preparePayloadForHash());
  }

  getHash() {
    return this._hashPromise;
  }
}
