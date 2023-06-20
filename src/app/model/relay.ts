export interface IRelay {
    name: string;
    url: string;
    read: boolean;
    write: boolean;
  }
  
  export class Relay implements IRelay {
    name: string;
    url: string;
    read: boolean;
    write: boolean;
  
    constructor(name: string, url: string, read: boolean = true, write: boolean = true) {
      this.name = name;
      this.url = url;
      this.read = read;
      this.write = write;
    }
  }