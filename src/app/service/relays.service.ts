import { Injectable } from '@angular/core';
import { NdkproviderService } from "./ndkprovider.service";
import { multi } from 'linkifyjs';

@Injectable({
  providedIn: 'root'
})
export class RelaysService {
  ndkProviderService: NdkproviderService;

  constructor(ndkProviderService: NdkproviderService) {
    this.ndkProviderService = ndkProviderService;
   }

   addRelay(relay: string){
    console.log(`Adding relay: ${relay}`);
    let subscribedRelays: string[] = this.ndkProviderService.appData.subscribedRelays.split(',');
    console.log(subscribedRelays);
   }

   removeRelay(relay: string){
    console.log(`Removing relay: ${relay}`);
    let subscribedRelays: string[] = this.ndkProviderService.appData.subscribedRelays.split(',');
    console.log(subscribedRelays);
   }

   async getRelays() {
    let relays = await this.ndkProviderService.getUserSubscribedRelays();
    this.ndkProviderService.publishAppData(undefined, undefined, undefined, relays.toString());
    console.log(relays);
   }
   
}
