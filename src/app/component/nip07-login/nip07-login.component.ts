import { Component } from '@angular/core';
import NDK from '@nostr-dev-kit/ndk';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';

@Component({
  selector: 'app-nip07-login',
  templateUrl: './nip07-login.component.html',
  styleUrls: ['./nip07-login.component.scss'],
})
export class Nip07LoginComponent {

  ndkProvider:NdkproviderService;
  constructor(ndkProvider: NdkproviderService){
    this.ndkProvider = ndkProvider;
  }

  attemptLogin(){
    this.ndkProvider.attemptLogin();
  }

  isLoggedIn():boolean{
    return this.ndkProvider.isLoggedIn();
  }

  getNdk():NDK|undefined{
    return this.ndkProvider.ndk;
  }

}
