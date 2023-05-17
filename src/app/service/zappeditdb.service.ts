
import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { User } from '../model/user';

const DATASTORE = {
  users: "++hexPubKey, name, displayName, pictureUrl, nip05, npub, about",
};

@Injectable({
  providedIn: 'root'
})
export class ZappeditdbService extends Dexie{
  ready = false;
  users!: Table<User>;

  constructor() {
    super("ZappedItDB");
    this.version(1).stores(DATASTORE);
  }
}
