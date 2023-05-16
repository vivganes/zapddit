
import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { User } from '../model/user';

export const NAME = "ZappedItDB";
export const VERSION = 1;

const DATASTORE = {
  users: "++npub, name, displayName, pictureUrl, nip05, hexpubkey, about",
};

@Injectable({
  providedIn: 'root'
})
export class ZappeditdbService extends Dexie{
  ready = false;
  users!: Table<User>;

  constructor() {
    super(NAME);
    this.version(VERSION).stores(DATASTORE);
  }

  isAvailable() {
    if ("indexedDB" in window) {
      return new Promise<boolean>(resolve => {
        const req = window.indexedDB.open("testDB", 1);
        req.onsuccess = () => {
          resolve(true);
        };
        req.onerror = () => {
          resolve(false);
        };
      });
    }
    return Promise.resolve(false);
  }
}
