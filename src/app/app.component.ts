import { Component } from '@angular/core'
import '@cds/core/icon/register.js';
import { ClarityIcons, userIcon, boltIcon } from '@cds/core/icon';
import { NdkproviderService } from './service/ndkprovider.service';

ClarityIcons.addIcons(userIcon, boltIcon);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'zappedit'


  private ndkProvider: NdkproviderService;

  constructor(ndkProvider: NdkproviderService){
    this.ndkProvider = ndkProvider;
  }
  
  isLoggedIn (): boolean {
    return this.ndkProvider.isLoggedIn()
  }
  





  
}
