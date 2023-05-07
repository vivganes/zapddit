import { Component } from '@angular/core'
import '@cds/core/icon/register.js';
import { ClarityIcons, userIcon, boltIcon, childArrowIcon } from '@cds/core/icon';
import { NdkproviderService } from './service/ndkprovider.service';

ClarityIcons.addIcons(userIcon, boltIcon, childArrowIcon);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'zappedit'
  currentlyShowingTag: string = window.location.href.split("/").at(-1) || 'foodstr'

  private ndkProvider: NdkproviderService;

  constructor(ndkProvider: NdkproviderService){
    this.ndkProvider = ndkProvider;
  }
  
  isLoggedIn (): boolean {
    return this.ndkProvider.isLoggedIn()
  }

  search(){
    let tag =  (<HTMLInputElement>document.getElementById("search-input-sidenav-ng")).value;
    window.location.href = '/t/'+tag;
  }
  





  
}
