import { Component, Inject, Input } from '@angular/core';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';

@Component({
  selector: 'app-user-mention',
  templateUrl: './user-mention.component.html',
  styleUrls: ['./user-mention.component.scss']
})
export class UserMentionComponent {

  @Input()
  npub:string|undefined;

  @Input()
  hexKey:string|undefined;

  displayName?:string;
  href?:string;

  ndkProvider:NdkproviderService;

  constructor(ndkProvider:NdkproviderService){
    this.ndkProvider = ndkProvider
  }

  ngOnInit(){
    if(this.npub){
      this.ndkProvider.getProfileFromNpub(this.npub).then((profile => {
        if(profile){
          this.displayName = (profile.displayName? profile.displayName : (profile.name?profile.name : this.npub));
          this.href="https://snort.social/p/"+this.npub
        }
      }))
    } else if(this.hexKey){
      this.ndkProvider.getProfileFromHex(this.hexKey).then((profile => {
        if(profile){
          this.displayName = (profile.displayName? profile.displayName : (profile.name?profile.name : this.hexKey));
          this.href="https://snort.social/p/"+this.hexKey
        }
      }))
    }
  }

}
