import { createHash } from '../utils';

export type Record = {
  action: string;
  hash: string;
  previousNode?: string;
  createdAt: Date;
  lamportClock: number;
};

export type UnhashedRecord = Omit<Record, 'hash'>;

export const createRecord = async (input: UnhashedRecord) => {
  const hash = await createHash(input);
};
