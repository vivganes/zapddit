import { Component } from '@angular/core';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent {

  ndkProvider:NdkproviderService;

  constructor(ndkProvider:NdkproviderService){
    this.ndkProvider = ndkProvider;
  }
  
  attemptLoginWithNip07(){
    this.ndkProvider.attemptLoginWithNip07();
  }

  attemptLoginWithPrivateKey(){
    let privateKey = (<HTMLInputElement>document.getElementById('pkey')).value;
    this.ndkProvider.attemptLoginUsingPrivateKey(privateKey);
  }


}
