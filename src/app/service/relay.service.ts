import { Injectable } from '@angular/core';
import { NdkproviderService } from './ndkprovider.service';
import { ZappeditdbService } from './zappeditdb.service';
import { Relay } from '../model';

@Injectable({
  providedIn: 'root',
})
export class RelayService {
  ndkProvider: NdkproviderService;
  dbProvider: ZappeditdbService;

  constructor(ndkProviderService: NdkproviderService, zappeditdbService: ZappeditdbService) {
    this.ndkProvider = ndkProviderService;
    this.dbProvider = zappeditdbService;
  }

  async getRelays(): Promise<Relay[]> {
    const relays: Relay[] = await this.dbProvider.subscribedRelays.toArray();
    // console.log(relays);
    return relays;
  }

  async removeRelay(relay: string) {
    let relayList: Relay[] = [];
    this.dbProvider.subscribedRelays.delete(relay)
    relayList = await this.getRelays();
    this.ndkProvider.updateRelays(relayList);
  }

  async addRelay(relay: string, read: boolean, write: boolean) {
    let relayList: Relay[] = [];
    const relayName: string = relay.replace('wss://', '').replace('/', '');
    const newRelay: Relay = new Relay(relayName, relay, read, write);
    await this.ndkProvider.addRelayToDB(this.dbProvider.subscribedRelays, newRelay);
    relayList = await this.getRelays();
    this.ndkProvider.updateRelays(relayList);
  }

  
}
