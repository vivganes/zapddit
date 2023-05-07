import { Injectable } from '@angular/core';
import NDK, { NDKUserProfile } from '@nostr-dev-kit/ndk';
import { NdkproviderService } from './ndkprovider.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  ndkProviderService:NdkproviderService;
  constructor(ndkProviderService: NdkproviderService) { 
    this.ndkProviderService = ndkProviderService
  }

  async getProfileFromNpub(npub: string):Promise<NDKUserProfile | undefined>{
    
    const user = this.ndkProviderService.ndk?.getUser({
        npub: npub
    });
    await user?.fetchProfile();
    return user?.profile;
       
  }
}
