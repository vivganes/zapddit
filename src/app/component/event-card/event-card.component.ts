import { Component, Input } from '@angular/core';
import { NDKEvent, NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
import * as moment from 'moment';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';

@Component({
  selector: 'app-event-card',
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss']
})
export class EventCardComponent {

  @Input()
  event: NDKEvent|undefined
  author: NDKUserProfile|undefined

  private ndkProvider:NdkproviderService;

  ngOnInit() {
    this.getAuthor();
  }

  constructor(ndkProvider: NdkproviderService){
    this.ndkProvider = ndkProvider;
  }

  async getAuthor(){
    console.log("getAuthor called")
    let authorPubKey = this.event?.pubkey;
    if(authorPubKey){
      this.author =  await this.ndkProvider.getProfileFromHex(authorPubKey);
    }
  }

  formatTimestamp(timestamp: number|undefined): string{
    if(timestamp){
      return moment(timestamp*1000).fromNow();
    } else {
      return "Unknown time"
    }
  }



}
