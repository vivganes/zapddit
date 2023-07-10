import { Injectable } from '@angular/core';
import { NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
import Dexie, {  Table } from 'dexie';
import { User } from '../model';

const DATASTORE = {
  users: "hexPubKey, name, displayName, nip05, npub"
};
const VERSION = 1;


@Injectable({
  providedIn: 'root'
})
export class ObjectCacheService extends Dexie {

  //default TTL in seconds
  defaultTTL:number = 10;
  users!:Table<User>;

  constructor() {
    super('object-cache')
    this.version(VERSION).stores(DATASTORE);
  }

  async addUser(item:NDKUser){
    this.users.put({
      hexPubKey: item.hexpubkey(),
      name: item.profile?.name!,
      displayName: item.profile?.displayName!,
      nip05: item.profile?.nip05!,
      npub: item.npub,
      pictureUrl: item.profile?.image!,
      about: item.profile?.about!,
    }, item.hexpubkey())

    const self = this;
    setTimeout(() => {
      console.log("Deleting item with key "+ item.hexpubkey())
      self.deleteUserWithHexKey(item.hexpubkey())
    }, this.defaultTTL*1000);
  }

  deleteUserWithHexKey(hexPubKey:string){
    this.users.delete(hexPubKey)
  }

  async fetchUserWithNpub(npub:string):Promise<NDKUser | undefined>{
    const user:User|undefined = await this.users.where('npub').equals(npub).first();
    if(user){
      console.log("hit")
      const profile:NDKUserProfile = {
        name: user.name,
        displayName: user.displayName,
        image: user.pictureUrl,
        bio:user.about,
        about:user.about,
        nip05:user.nip05
      }
      const ndkUser = new NDKUser({npub: user.npub});
      ndkUser.profile = profile;
      return ndkUser;
    }
    console.log("miss")
    return undefined;
  }

  async fetchUserWithHexKey(hexPubKey:string):Promise<NDKUser | undefined>{
    const user:User|undefined = await this.users.get(hexPubKey);
    if(user){
      console.log("hit")
      const profile:NDKUserProfile = {
        name: user.name,
        displayName: user.displayName,
        image: user.pictureUrl,
        bio:user.about,
        about:user.about,
        nip05:user.nip05
      }
      const ndkUser = new NDKUser({npub: user.npub});
      ndkUser.profile = profile;
      return ndkUser;
    }
    console.log("miss")
    return undefined;
  }
}
