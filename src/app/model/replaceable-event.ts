import NDK, { NDKEvent } from "@nostr-dev-kit/ndk";

export abstract class ReplaceableEvent<T>{
  ndk:NDK;
  data:T;

  createEvent():NDKEvent{
    return new NDKEvent(this.ndk);
  }

  constructor(data:T, ndk:NDK){
    this.data = data;
    this.ndk = ndk;
  }

  abstract buildEvent(existing:T[]):NDKEvent;

  async buildAndPublish(existing:T[]){
    await this.buildEvent(existing).sign();
    await this.buildEvent(existing).publish();
  }
}
