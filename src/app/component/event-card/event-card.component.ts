import { Component, Input } from '@angular/core';
import { NDKEvent, NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
import * as moment from 'moment';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import * as linkify from "linkifyjs";
import linkifyHtml from "linkify-html";
import "linkify-plugin-hashtag";
import { getRandomAvatar } from "@fractalsoftware/random-avatar-generator";


@Component({
  selector: 'app-event-card',
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss']
})
export class EventCardComponent {

  @Input()
  event: NDKEvent|undefined
  author: NDKUserProfile|undefined
  zaps: Set<NDKEvent>|undefined
  upZaps: Set<NDKEvent>= new Set<NDKEvent>()
  downZaps: Set<NDKEvent>= new Set<NDKEvent>()
  tempAvatar: string = '';

  private ndkProvider:NdkproviderService;

  ngOnInit() {
    this.getAuthor();
    this.fetchZapsAndSegregate();
    this.tempAvatar = this.getTempAvatar();
  }

  constructor(ndkProvider: NdkproviderService){
    this.ndkProvider = ndkProvider;
  }

  async getAuthor(){
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
      hashtag: (href: string) => "/t/" + href.substring(1).toLowerCase(),
    }, 
    };
    return linkifyHtml(
      this.event?.content || '',
      options
    );
  }

  getImageUrls(): RegExpMatchArray|null|undefined{
    const urlRegex = /https:.*?\.(?:png|jpg|svg|gif|jpeg)/ig;
    const imgArray = this.event?.content.match(urlRegex);
    return imgArray;
  }

  async upZap(){
    if(this.event){
      console.log(await this.ndkProvider.zapRequest(this.event));
    }
  }

  async downZap(){
    if(this.event){
      console.log(await this.ndkProvider.downZapRequest(this.event, await this.ndkProvider.getNdkUserFromNpub('npub1yg4uynm45lz535tpm6w04ul3yqv8tnz2wy94wgqwkm60xx3g5m5sa7ytwt'), 1000, "-"));
    }
  }

  async fetchZapsAndSegregate(){
    if(this.event){
      this.zaps = await this.ndkProvider.fetchZaps(this.event);
      this.segregateZaps();
    } 
  }

  async segregateZaps(){
    if(this.zaps){
    for(let zap of this.zaps){
      if(this.isDownzap(zap)){
        this.downZaps.add(zap);
      } else {
        this.upZaps.add(zap);
      }
    }
  }

  }

  isDownzap(event: NDKEvent){
   const descTagSet = event.getMatchingTags('description')
   if(descTagSet.length>0){
      const descTag = descTagSet[0]
      if(descTag.length>1){
        const descriptionStr = descTag[1];
        const descriptionObj = JSON.parse(descriptionStr);
        if(descriptionObj.content?.indexOf("-")>-1){
          return true;
        }
      }
   }
   return false;
  }

  getTempAvatar(): string{
    return window.btoa(getRandomAvatar(5,'circle'));
  }

  
}