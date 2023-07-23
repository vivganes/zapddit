import { Injectable } from '@angular/core';
import NDK, { NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
import Dexie, {  Table } from 'dexie';
import { User } from '../model/user';
import { NdkproviderService } from './ndkprovider.service';
import { Community } from '../model/community';

const DATASTORE = {
  users: "hexPubKey, name, displayName, nip05, npub",
  communities: "id,name,displayName,creatorHexKey,description"
};


@Injectable({
  providedIn: 'root'
})
export class ObjectCacheService extends Dexie {

  //default TTL in seconds
  defaultTTL:number = 60*60; //1 hour
  users!:Table<User>;
  communities!:Table<Community>;

  constructor() {
    super('object-cache')
    this.version(1).stores({
      users: DATASTORE.users
    });
    this.version(2).stores(DATASTORE);
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
      lud06: item.profile?.lud06!,
      lud16: item.profile?.lud16
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

  async fetchUserWithNpub(npub:string, ndkToInject:NDK):Promise<NDKUser | undefined>{
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
      ndkUser.ndk = ndkToInject;
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
