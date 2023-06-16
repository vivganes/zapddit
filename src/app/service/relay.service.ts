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

  async getRelays(): Promise<string[]> {
    const relays: Relay[] = await this.dbProvider.subscribedRelays.toArray();
    let relayList: string[] = [];
    relays.forEach(x => {
      relayList.push(x.url);
    });
    return relayList;
  }

  async removeRelay(relay: string) {
    let relayList: string[] = [];
    this.dbProvider.subscribedRelays.delete(relay)
    relayList = await this.getRelays();
    this.ndkProvider.updateRelays(relayList);
  }

  async addRelay(relay: string) {
    let relayList: string[] = [];
    const relayName: string = relay.replace('wss://', '').replace('/', '');
    const newRelay: Relay = new Relay(relayName, relay);
    this.ndkProvider.addRelayToDB(this.dbProvider.subscribedRelays, newRelay);
    relayList = await this.getRelays();
    this.ndkProvider.updateRelays(relayList);
  }

  
}
