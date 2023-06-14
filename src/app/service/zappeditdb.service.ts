
import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { User, Relay } from '../model';

const DATASTORE = {
  peopleIFollow: "++hexPubKey, name, displayName, pictureUrl, nip05, npub, about",
  mutedPeople:"++hexPubKey, name, displayName, pictureUrl, nip05, npub, about",
  subscribedRelays: "++name, url"
};
const VERSION = 1;
@Injectable({
  providedIn: 'root'
})
export class ZappeditdbService extends Dexie{
  ready = false;
  peopleIFollow!: Table<User>;
  mutedPeople!: Table<User>;
  subscribedRelays!: Table<Relay>;

  constructor() {
    super("ZappedItDB");

    this.version(VERSION).stores(DATASTORE);

    this.version(Math.round(this.verno + 2)).stores({mutedPeople: DATASTORE.mutedPeople});

    this.version(Math.round(this.verno + 3)).stores({subscribedRelays: DATASTORE.subscribedRelays});
  }
}
