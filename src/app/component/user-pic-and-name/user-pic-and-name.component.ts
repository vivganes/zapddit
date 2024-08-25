import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import { ObjectCacheService } from 'src/app/service/object-cache.service';

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

  constructor(private ndkProvider:NdkproviderService, private objectCache:ObjectCacheService){

  }

  ngOnChanges(changes:SimpleChanges){
    if(changes['npub'].currentValue !== changes['npub'].previousValue){
      this.populateUserUsingNpub();
    }
  }

  ngOnInit(){
    if(!this.user){
      if(this.hexKey){
        this.populateUser();
      }else if(this.npub){
        this.populateUserUsingNpub();
      }
    }
    else{
      if(!this.user.profile){
        const user = this.user;
        this.user.fetchProfile().then((event)=>{
          this.objectCache.addUser(user);
        })
      }
    }
  }

  async populateUserUsingNpub(){
    this.user = await this.ndkProvider.getNdkUserFromNpub(this.npub!);
  }

  async populateUser(){
    this.user = await this.ndkProvider.getNdkUserFromHex(this.hexKey!);
  }

  openAuthorInSnort(){
    if(this.user?.npub)
      window.open('https://snort.social/p/'+this.user?.npub,'_blank')
  }

  onDeleteIconClicked(evt:any){
    this.deleteIconClicked.emit(this.user)
  }

}
