import { Injectable } from '@angular/core';
import { NdkproviderService } from "./ndkprovider.service";

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
    let subscribedRelays: string[] = this.ndkProviderService.appData.subscribedRelays;
   }

   removeRelay(relay: string){
    console.log(`Removing relay: ${relay}`);
   }
   
}
