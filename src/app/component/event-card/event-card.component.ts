import { Component, Input } from '@angular/core';
import { NDKEvent, NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
import * as moment from 'moment';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import * as linkify from "linkifyjs";
import linkifyHtml from "linkify-html";
import "linkify-plugin-hashtag";

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

  linkifyContent(): string{
    const options = { defaultProtocol: "https",
    formatHref: {
      hashtag: (href: string) => "/t/" + href.substring(1),
    }, 
    };
    return linkifyHtml(
      this.event?.content || '',
      options
    );
  }

  getImageUrls(): RegExpMatchArray|null|undefined{
    const urlRegex = /https:.*?\.(?:png|jpg|svg|jpeg)/ig;
    const imgArray = this.event?.content.match(urlRegex);
    console.log(imgArray);
    return imgArray;
  }
}