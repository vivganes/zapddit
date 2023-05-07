import { Injectable } from '@angular/core';
import NDK, {NDKConstructorParams, NDKNip07Signer, NDKUser, NDKUserProfile} from "@nostr-dev-kit/ndk";

@Injectable({
  providedIn: 'root'
})
export class NdkproviderService {

  ndk: NDK|undefined;
  currentUserProfile: NDKUserProfile|undefined;

  constructor() { 
    this.attemptLogin();
  }    

  attemptLogin(){
    (async() => {
      console.log("waiting for window.nostr");
      while(!window.hasOwnProperty("nostr")) // define the condition as you like
          await new Promise(resolve => setTimeout(resolve, 1000));

      //do this after window.nostr is available
      this.initializeClientWithSigner(new NDKNip07Signer());

      })();
  }

  async getProfileFromNpub(npub: string):Promise<NDKUserProfile | undefined>{    
    const user = this.ndk?.getUser({
        npub: npub
    });
    await user?.fetchProfile();
    return user?.profile;       
  }

  private async initializeClientWithSigner(nip07signer: NDKNip07Signer) {
    var params: NDKConstructorParams = { signer: nip07signer, explicitRelayUrls: ["wss://nos.lol"] };
    try {
      this.ndk = new NDK(params);
      await this.ndk.connect();
      nip07signer.user().then(async (user) => {
        if (!!user.npub) {
            console.log("Permission granted to read their public key:", user.npub);
            this.currentUserProfile = await this.getProfileFromNpub(user.npub);          
        } else {
          console.log("Permission not granted");
        }
    });
    } catch (err) {
      console.log(err);
    }
  }

  isLoggedIn():boolean{
    return this.ndk!==undefined;
  }

  getCurrentUserProfile():NDKUserProfile|undefined{
    return this.currentUserProfile;
  }


  

}
