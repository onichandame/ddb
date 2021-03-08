import { Dexie } from 'dexie';

type Type = 'primitive' | 'set' | 'oset';

type Data = {
  id: string;
  type: Type;
  history: {
    action: string;
    hash: string;
    previousNode?: string;
    createdAt: Date;
    lamportClock: number;
  }[];
};

export class Storage extends Dexie {
  creator: Dexie.Table<string>;
  data: Dexie.Table<Data, string>;
  constructor(name: string) {
    super(name);
    this.version(1).stores({ data: `creator data` });
    this.data = this.table(`&id,history`);
    this.creator = this.table(`creator`);
  }
}
