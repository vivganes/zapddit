import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  npub?:string;

  @Input()
  user?:NDKUser;

  @Input()
  onlyPic:boolean = false;

  @Input()
  showClickableDeleteIcon:boolean = false;

  @Output()
  deleteIconClicked:EventEmitter<NDKUser> = new EventEmitter<NDKUser>();

  constructor(private ndkProvider:NdkproviderService){

  }

  ngOnInit(){
    if(!this.user){
      if(this.hexKey){
        this.populateUser();
      }else if(this.npub){
        console.log("pic and name "+this.npub)
        this.populateUserUsingNpub();
      }
    }
    else{
      if(!this.user.profile){
        this.user.fetchProfile()
      }
    }
  }

  async populateUserUsingNpub(){
    this.user = await this.ndkProvider.getNdkUserFromNpub(this.npub!);
    await this.user?.fetchProfile()
  }

  async populateUser(){
    this.user = await this.ndkProvider.getNdkUserFromHex(this.hexKey!);
    await this.user?.fetchProfile()
  }

  openAuthorInSnort(){
    window.open('https://snort.social/p/'+this.user?.npub,'_blank')
  }

  onDeleteIconClicked(evt:any){
    this.deleteIconClicked.emit(this.user)
  }

}
