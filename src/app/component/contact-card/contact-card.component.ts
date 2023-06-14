import { Component, OnInit, Input, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
import { User } from '../../model/user';
import { NDKEvent, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { ZappeditdbService } from 'src/app/service/zappeditdb.service';
import { NdkproviderService } from '../../service/ndkprovider.service';
import { Util } from 'src/app/util/Util';
import { LoginUtil } from 'src/app/util/LoginUtil';

@Component({
  selector: 'app-contact-card',
  templateUrl: './contact-card.component.html',
  styleUrls: ['./contact-card.component.scss']
})
export class ContactCardComponent implements OnInit {

  @Input()
  contact:User | undefined;
  event: NDKEvent | undefined;
  unfollowed:boolean = false;
  eventInProgress:boolean = false;
  @Input()
  showFollow:boolean = true;
  @Output()
  contactListUpdated = new EventEmitter<boolean>();
  contactLoading: boolean = false;
  isNIP05Verified:boolean = false;

  constructor(private ndkProvider: NdkproviderService, private dbService:ZappeditdbService, private changeDetector:ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.populateContactDetails();
  }

  populateContactDetails(){
    this.contactLoading = true;
    this.ndkProvider.getProfileFromHex(this.contact?.hexPubKey!).then(async (userProfile)=> {
      console.log("Got for "+ this.contact?.hexPubKey + " - "+ userProfile?.displayName)
      if(userProfile){
        this.contact  = this.convertToUser(userProfile, this.contact?.hexPubKey!);
      }

      var nip05Address = userProfile?.nip05;
      if(nip05Address)
        this.isNIP05Verified = await this.ndkProvider.checkIfNIP05Verified(nip05Address, this.contact?.hexPubKey!);

      this.contactLoading = false;
      this.changeDetector.detectChanges();
    })
  }

  convertToUser(profile : NDKUserProfile, hexPubKey: string){
    let user:User = {
      hexPubKey: hexPubKey,
      displayName: profile.displayName,
      name: profile.name,
      about: profile.about,
      pictureUrl: profile.image,
      npub: LoginUtil.hexToBech32('npub',hexPubKey)
    }
    return user;
  }

  getImageUrls(): RegExpMatchArray | null | undefined {
    const urlRegex = /https:.*?\.(?:png|jpg|svg|gif|jpeg|webp)/gi;
    const imgArray = this.event?.content.match(urlRegex);
    return imgArray;
  }

  openInSnort(item?:User){
    window.open('https://snort.social/p/'+item?.npub,'_blank');
  }

  unFollow(authorHexPubKey?:string){
    this.eventInProgress = true;
    this.ndkProvider.followUnfollowContact(authorHexPubKey!, false).then(async res => {
      this.dbService.peopleIFollow.where('hexPubKey').equalsIgnoreCase(authorHexPubKey!.toString()).delete().then(()=>{
        console.log("Contact removed");
        this.eventInProgress = false;
        this.unfollowed = true;
        this.contactListUpdated.emit(true);
      })
    }, err=>{
      console.log(err);
      this.eventInProgress = false;
      this.unfollowed = false;
    }).catch((error) => {
      this.eventInProgress = false;
      this.unfollowed = false;
      console.error ("Error from unfollow: " + error);
    });
   }
}
