import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { NDKEvent, NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
import * as moment from 'moment';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import * as linkify from 'linkifyjs';
import linkifyHtml from 'linkify-html';
import 'linkify-plugin-hashtag';
import { getRandomAvatar } from '@fractalsoftware/random-avatar-generator';
import QRCodeStyling from 'qr-code-styling';

const linkifyOptions = {

}

@Component({
  selector: 'app-event-card',
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss'],
})
export class EventCardComponent {
  @Input()
  event: NDKEvent | undefined;
  author: NDKUserProfile | undefined;
  zaps: Set<NDKEvent> | undefined;
  upZaps: Set<NDKEvent> = new Set<NDKEvent>();
  downZaps: Set<NDKEvent> = new Set<NDKEvent>();
  upZapTotalMilliSats: number = 0
  downZapTotalMilliSats: number = 0
  showQR: boolean= false;
  invoice:string|null=null;
  @ViewChild("canvas", { static: true }) 
  canvas: ElementRef | undefined;
  linkifiedContent:string|undefined;
  hashTagsMap:Map<number,string> = new Map<number,string>();

  @Input()
  downZapEnabled: boolean | undefined;
  tempAvatar: string = '';

  ndkProvider: NdkproviderService;

  ngOnInit() {
    this.linkifiedContent = this.linkifyContent(this.event?.content)
    console.log(this.linkifiedContent);
    this.getAuthor();
    this.fetchZapsAndSegregate();
    this.tempAvatar = this.getTempAvatar();
  }

  constructor(ndkProvider: NdkproviderService) {
    this.ndkProvider = ndkProvider;
  }

  async getAuthor() {
    let authorPubKey = this.event?.pubkey;
    if (authorPubKey) {
      this.author = await this.ndkProvider.getProfileFromHex(authorPubKey);
    }
  }

  formatTimestamp(timestamp: number | undefined): string {
    if (timestamp) {
      return moment(timestamp * 1000).fromNow();
    } else {
      return 'Unknown time';
    }
  }

  linkifyContent(content?:string): string {
    let hashTagCounter = 0;
    this.hashTagsMap = new Map<number,string>();
    const options = {
      defaultProtocol: 'https',
      formatHref: {
        hashtag: (href: string) => '/t/' + href.substring(1).toLowerCase(),
      },
      render:{
        hashtag: (opts:any) => {
          return `<app-hashtag topic="${opts.content?.substring(1).toLowerCase()}"></app-hashtag>` 
        }
      }
    };
    const html:string =  linkifyHtml(this.event?.content || '', options);
    return html;
  }

  getImageUrls(): RegExpMatchArray | null | undefined {
    const urlRegex = /https:.*?\.(?:png|jpg|svg|gif|jpeg)/gi;
    const imgArray = this.event?.content.match(urlRegex);
    return imgArray;
  }

  async upZap() {
    if (this.event) {
      const invoice = await this.ndkProvider.zapRequest(this.event);
      const qr = new QRCodeStyling({
        width:  256,
        height:  256,
        data: invoice?invoice:undefined,
        margin: 5,
        type: "canvas",
        dotsOptions: {
          type: "rounded",
        },
        cornersSquareOptions: {
          type: "extra-rounded",
        }
      });
      qr.append(this.canvas?.nativeElement);
      this.invoice = invoice;
      this.showQR=true;
    }
  }

  isDownzapEnabled(): boolean {
    return this.ndkProvider.appData.downzapRecipients !== '';
  }

  async downZap() {
    if (this.event) {
      const invoice = await this.ndkProvider.downZapRequest(
          this.event,
          await this.ndkProvider.getNdkUserFromNpub(this.ndkProvider.appData.downzapRecipients),
          '-'
        );
        const qr = new QRCodeStyling({
          width:  256,
          height:  256,
          data: invoice?invoice:undefined,
          margin: 5,
          type: "canvas",
          dotsOptions: {
            type: "rounded",
          },
          cornersSquareOptions: {
            type: "extra-rounded",
          }
        });
        qr.append(this.canvas?.nativeElement);
        this.invoice = invoice;
        this.showQR = true;
    }
  }

  async fetchZapsAndSegregate() {
    if (this.event) {
      this.zaps = await this.ndkProvider.fetchZaps(this.event);
      this.segregateZaps();
    }
  }

  async segregateZaps() {
    if (this.zaps) {
      for (let zap of this.zaps) {
        if (this.isDownzap(zap)) {
          this.downZaps.add(zap);
          const milliSats = this.readMilliSatsFromZap(zap);
          this.downZapTotalMilliSats += milliSats;
        } else {
          this.upZaps.add(zap);
          const milliSats = this.readMilliSatsFromZap(zap);
          this.upZapTotalMilliSats += milliSats;
        }
      }
    }
  }

  readMilliSatsFromZap(zap:NDKEvent):number{
    if(zap.getMatchingTags('description')[0]){
      if(zap.getMatchingTags('description')[0][1]){      
        const tags = JSON.parse(zap.getMatchingTags('description')[0][1]).tags;
        if(tags){
          const innerTags = this.getMatchingTags(tags,'amount')
          if( innerTags && innerTags[0] && innerTags[0][1] ){
            return Number.parseInt(innerTags[0][1]);
          }
        }        
      }
    }
    return 0;    
  }

  getMatchingTags(tags:string[],tagName:string) {
    return tags.filter(tag => tag[0] === tagName);
  }

  isDownzap(event: NDKEvent) {
    const descTagSet = event.getMatchingTags('description');
    if (descTagSet.length > 0) {
      const descTag = descTagSet[0];
      if (descTag.length > 1) {
        const descriptionStr = descTag[1];
        const descriptionObj = JSON.parse(descriptionStr);
        if (descriptionObj.content?.indexOf('-') > -1) {
          return true;
        }
      }
    }
    return false;
  }

  getTempAvatar(): string {
    return window.btoa(getRandomAvatar(5, 'circle'));
  }
}
