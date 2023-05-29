import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { User } from '../../model/user';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { ZappeditdbService } from 'src/app/service/zappeditdb.service';
import { NdkproviderService } from '../../service/ndkprovider.service';

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

  @Output()
  contactListUpdated = new EventEmitter<boolean>();

  constructor(private ndkProvider: NdkproviderService, private dbService:ZappeditdbService) {
  }

  ngOnInit(): void {

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
        this.contactListUpdated.emit(true);
      })
    }, err=>{
      console.log(err);
      this.eventInProgress = false;
    }).catch((error) => {
      this.eventInProgress = false;
      console.error ("Error from unfollow: " + error);
    });
   }
}
