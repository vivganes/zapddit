import { Component, Input } from '@angular/core';
import { NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';

@Component({
  selector: 'app-user-pic-and-name',
  templateUrl: './user-pic-and-name.component.html',
  styleUrls: ['./user-pic-and-name.component.scss']
})
export class UserPicAndNameComponent {

  @Input()
  hexKey?:string;

  @Input()
  user?:NDKUser;

  constructor(private ndkProvider:NdkproviderService){

  }

  ngOnInit(){
    if(!this.user){
      if(this.hexKey){
        this.populateUser();
      }
    } else {
      if(!this.user.profile){
        this.user.fetchProfile()
      }
    }
  }

  async populateUser(){
    this.user = await this.ndkProvider.getNdkUserFromHex(this.hexKey!);
    await this.user?.fetchProfile()
  }  

  openAuthorInSnort(){
    window.open('https://snort.social/p/'+this.user?.npub,'_blank')
  }

}
