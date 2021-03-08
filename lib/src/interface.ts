type Data = string | number | Set<any> | Array<any>;

export class Interface {
  set(key: string, val: Data) {}
  get(key: string) {}
}
