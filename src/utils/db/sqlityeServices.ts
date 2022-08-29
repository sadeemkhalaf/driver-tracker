export class SqliteService {
  value: any;

  constructor() {}

  public setValue(v: string) {
    this.value = v;
  }

  public getValue() {
    return this.value;
  }
}
