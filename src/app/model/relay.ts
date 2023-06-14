export interface IRelay {
    name: string;
    url: string;
  }
  
  export class Relay implements IRelay {
    name: string;
    url: string;
  
    constructor(name: string, url: string) {
      this.name = name;
      this.url = url;
    }
  }