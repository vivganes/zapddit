import { Component } from '@angular/core';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent {

  ndkProvider:NdkproviderService;

  constructor(ndkProvider:NdkproviderService, private router:Router){
    this.ndkProvider = ndkProvider;
  }

  ngOnInit(){
    this.ndkProvider.loginCompleteEmitter.subscribe((complete: boolean) => {
      this.router.navigateByUrl('/feed');
    })
  }
  
  attemptLoginWithNip07(){
    this.ndkProvider.attemptLoginWithNip07();
  }

  attemptLoginWithPrivateOrPubKey(){
    let enteredKey = (<HTMLInputElement>document.getElementById('pkey')).value;
    this.ndkProvider.attemptLoginUsingPrivateOrPubKey(enteredKey);
  }

  attemptGenerateNewCredential(){
    this.ndkProvider.setAsNewToNostr();
    this.ndkProvider.attemptToGenerateNewCredential();
  }

  attemptLoginWithoutAccount(){
    this.ndkProvider.attemptToTryUnauthenticated();
  }
}
