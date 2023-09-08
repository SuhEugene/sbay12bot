import { readFile, writeFile } from "fs/promises";

export class ArrayIO<T> {

  private filePath: string
  private _data: Array<T>

  constructor(filePath: string) {
    this.filePath = filePath;
    this._data = [];
  }
  
  async read() {
    let reportsString = "";
    try {
      reportsString = String(await readFile(this.filePath));
    } catch (e) {
      console.error("FS CANNOT READ", e);
      reportsString = "[]";
    }

    try { this._data = JSON.parse(reportsString); }
    catch (e) { console.error("CANNOT PARSE", this.filePath, e); console.error("RS", reportsString); }

    return this._data;
  }

  async write() { await writeFile(this.filePath, JSON.stringify(this._data)); }

  async push(v: T) {
    this.read();
    this._data.push(v);
    this.write();
  }

  get data() { return this._data; }
  set data(v: T[]) { this._data = v; }
}
