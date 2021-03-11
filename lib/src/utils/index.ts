import { v1 } from 'uuid';
// TODO isomorphic crypto
import crypto from 'isomorphic-webcrypto';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const createUid = () => v1();

export const createHash = async (raw: string) => {
  const buf = await crypto.subtle.digest(
    { name: `SHA-256` },
    encoder.encode(raw)
  );
  return decoder.decode(buf);
};
