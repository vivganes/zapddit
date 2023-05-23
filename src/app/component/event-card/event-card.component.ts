import { Component, ElementRef, Input, ViewChild,  Renderer2 } from '@angular/core';
import { NDKEvent, NDKTag, NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
import * as moment from 'moment';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import linkifyHtml from 'linkify-html';
import QRCodeStyling from 'qr-code-styling';
import { ZappeditdbService } from '../../service/zappeditdb.service';
import { Constants } from 'src/app/util/Constants';
import { Util } from 'src/app/util/Util';


const MENTION_REGEX = /(#\[(\d+)\])/gi;
const NOSTR_NPUB_REGEX = /nostr:(npub[\S]*)/gi;

@Component({
  selector: 'app-event-card',
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss'],
})
export class EventCardComponent {
  @Input()
  event: NDKEvent | undefined;

  @Input()
  showingComments: boolean = false;
  authorWithProfile: NDKUser | undefined;
  canLoadMedia:boolean = false;
  imageUrls: RegExpMatchArray | null | undefined;
  zaps: Set<NDKEvent> = new Set<NDKEvent>();
  replies: Set<NDKEvent> = new Set<NDKEvent>();
  upZapTotalMilliSats: number = 0
  downZapTotalMilliSats: number = 0
  showQR: boolean= false;
  invoice:string|null=null;
  @ViewChild("canvas", { static: true })
  canvas: ElementRef | undefined;
  linkifiedContent:string|undefined;
  loadingRelatedEvents:boolean = false;
  blurImageId:any = Math.floor(Math.random() * (5)) + 1;;
  hashTagsMap:Map<number,string> = new Map<number,string>();
  showMediaFromPeopleIFollow:boolean = true;

  @Input()
  downZapEnabled: boolean | undefined;

  ndkProvider: NdkproviderService;
  displayedContent: string|undefined;

  constructor(ndkProvider: NdkproviderService, private renderer: Renderer2, private dbService: ZappeditdbService) {
    this.ndkProvider = ndkProvider;
    var mediaSettings = localStorage.getItem(Constants.SHOWMEDIA)
    if(mediaSettings!=null || mediaSettings!=undefined || mediaSettings!=''){
      this.showMediaFromPeopleIFollow = Boolean(JSON.parse(mediaSettings!));
    }
  }

  ngOnInit() {
    this.displayedContent = this.replaceHashStyleMentionsWithComponents();
    this.displayedContent = this.replaceNpubMentionsWithComponents(this.displayedContent)
    this.linkifiedContent = this.linkifyContent(this.displayedContent)
    this.getAuthor();
    this.getRelatedEventsAndSegregate();
    this.getImageUrls();
  }

  showComments(){
    this.showingComments = true;
  }

  hideComments(){
    this.showingComments = false;
  }

  async getRelatedEventsAndSegregate(){
    if(this.event){
      this.loadingRelatedEvents = true;
      let relatedEvents = await this.ndkProvider.getRelatedEventsOfNote(this.event);
      if(relatedEvents){
        for (let event of relatedEvents) {
          if(event.kind === 1){
            this.replies.add(event);
          } else if (event.kind === 9735){
            this.zaps.add(event);
          } else {
            console.error("This kind of event is unrecognized. Ignoring");
          }
        }
        await this.segregateZaps();
        this.loadingRelatedEvents = false;
      }      
    }
  }

  replaceHashStyleMentionsWithComponents(){
    var returnContent = this.event?.content;
    if(returnContent){
      var matches = returnContent.matchAll(MENTION_REGEX);
      for(let match of matches){
        try{
          const hex = this.getNthTag(Number.parseInt(match[2]));
          returnContent = returnContent.replaceAll(match[0],`<app-user-mention hexKey="${hex}"></app-user-mention>`)
        } catch(e){
          console.error(e);
        }
      }
      return returnContent;
    }
    return this.event?.content;
  }

  replaceNpubMentionsWithComponents(content?:string): string|undefined{
    let displayedContent = content;
    if(displayedContent){
      var matches = displayedContent.matchAll(NOSTR_NPUB_REGEX);
      for(let match of matches){
        try{
          let npub = match[1];
          displayedContent = displayedContent.replaceAll(match[0],`<app-user-mention npub="${npub}"></app-user-mention>`)
        }catch(e){
          console.error(e);
        }
      }
    }
    return displayedContent;
  }

  async share(){
    navigator
    .share({
        url: "https://zapddit.com/n/"+ this.event?.id
    })
    .then(() => console.log('Successful share! 🎉'))
    .catch(err => console.error(err));
  }

  async getAuthor() {
    let authorPubKey = this.event?.pubkey;
    if (authorPubKey) {
      this.canLoadMedia = (await this.dbService.peopleIFollow.where({hexPubKey:authorPubKey}).toArray()).length > 0;
      this.authorWithProfile = await this.ndkProvider.getNdkUserFromHex(authorPubKey);
    }
  }

  getNthTag( n:number):string{
    const tags:NDKTag[]|undefined = this.event?.tags;
    if(tags){
     return tags[n][1];
    }
    return '';
  }

  formatTimestamp(timestamp: number | undefined): string {
    if (timestamp) {
      return moment(timestamp * 1000).fromNow();
    } else {
      return 'Unknown time';
    }
  }

  linkifyContent(content?:string): string {
    const options = {
      defaultProtocol: 'https',
      nl2br: true,
      formatHref: {
        hashtag: (href: string) => '/t/' + href.substring(1).toLowerCase(),
      },
      render:{
        hashtag: (opts:any) => {
          return `<app-hashtag topic="${opts.content?.substring(1).toLowerCase()}"></app-hashtag>`
        }
      },
      target: {
        url: "_blank"
      }
    };
    const html:string =  linkifyHtml(content || '', options);
    return html;
  }

  getImageUrls(): RegExpMatchArray | null | undefined {
    const urlRegex = /https:.*?\.(?:png|jpg|svg|gif|jpeg|webp)/gi;
    const imgArray = this.event?.content.match(urlRegex);
    this.imageUrls = imgArray
    return imgArray;
  }

  clickToLoadMedia(){
    this.canLoadMedia = true;
  }

  async upZap() {
    if (this.event) {
      this.renderer.setProperty(this.canvas?.nativeElement, 'innerHTML', '');
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
      this.renderer.setProperty(this.canvas?.nativeElement, 'innerHTML', '');
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
      let zaps = await this.ndkProvider.fetchZaps(this.event);
      if(zaps){
        this.zaps = zaps;
        this.segregateZaps();
      }
    }
  }

  async segregateZaps() {
    if (this.zaps) {
      for (let zap of this.zaps) {
        try{
          if (this.isDownzap(zap)) {
            const milliSats = this.readMilliSatsFromZap(zap);
            if(milliSats){
              this.downZapTotalMilliSats += milliSats;
            }
          } else {
            const milliSats = this.readMilliSatsFromZap(zap);
            if(milliSats){
              this.upZapTotalMilliSats += milliSats;
            }
          }
        } catch(e){
          console.error(e);
        }
      }
    }
  }

  readMilliSatsFromZap(zap:NDKEvent):number|undefined{
    const invoiceTag = zap.getMatchingTags('bolt11');
    if(invoiceTag && invoiceTag[0]){
      const millis = Util.getAmountFromInvoice(invoiceTag[0][1]);
      return millis;
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

  zapDoneClicked(){
    this.showQR = false;
    this.downZapTotalMilliSats = this.upZapTotalMilliSats = 0;
    this.fetchZapsAndSegregate();
  }

  openInSnort(){
    window.open('https://snort.social/e/'+this.event?.id,'_blank')
  }

  openAuthorInSnort(){
    window.open('https://snort.social/p/'+this.authorWithProfile?.npub,'_blank')
  }

 hasMedia():boolean{
  return this.imageUrls!=null && this.imageUrls?.length > 0;
 }
}
