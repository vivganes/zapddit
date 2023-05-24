import { Component, ElementRef, Input, ViewChild,  Renderer2 } from '@angular/core';
import { NDKEvent, NDKTag, NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
import * as moment from 'moment';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import linkifyHtml from 'linkify-html';
import QRCodeStyling from 'qr-code-styling';
import { ZappeditdbService } from '../../service/zappeditdb.service';
import { Constants } from 'src/app/util/Constants';
import { Util } from 'src/app/util/Util';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Clipboard } from '@angular/cdk/clipboard';

const MENTION_REGEX = /(#\[(\d+)\])/gi;
const NOSTR_NPUB_REGEX = /nostr:(npub[\S]*)/gi;
const NOSTR_NOTE_REGEX = /nostr:(note1[\S]*)/gi;

@Component({
  selector: 'app-event-card',
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss'],
})
export class EventCardComponent {
  // Regular expression patterns to match video URLs
  private readonly youtubeRegex:RegExp = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]+)/g;
  private readonly vimeoRegex:RegExp = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/g;
  private readonly dailymotionRegex:RegExp = /(?:https?:\/\/)?(?:www\.)?dailymotion\.com\/video\/([\w-]+)/g;

  @Input()
  event: NDKEvent | undefined;

  @Input()
  showingComments: boolean = false;
  @Input()
  isQuotedEvent: boolean = false;
  authorWithProfile: NDKUser | undefined;
  canLoadMedia:boolean = false;
  imageUrls: RegExpMatchArray | null | undefined;
  videoUrls: Map<string,string|undefined> = new Map<string,string|undefined>();
  onlineVideoUrls:string[] = [];
  zaps: Set<NDKEvent> = new Set<NDKEvent>();
  replies: NDKEvent[] = [];
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

  constructor(ndkProvider: NdkproviderService, private renderer: Renderer2,
    private dbService: ZappeditdbService, private router:Router, private domSanitizer:DomSanitizer, private clipboard: Clipboard) {
    this.ndkProvider = ndkProvider;
    var mediaSettings = localStorage.getItem(Constants.SHOWMEDIA)
    if(mediaSettings!=null || mediaSettings!=undefined || mediaSettings!=''){
      this.showMediaFromPeopleIFollow = Boolean(JSON.parse(mediaSettings!));
    }
  }

  ngOnInit() {
    this.displayedContent = this.replaceHashStyleMentionsWithComponents();
    this.displayedContent = this.replaceNpubMentionsWithComponents(this.displayedContent)
    this.displayedContent = this.replaceNoteMentionsWithComponents(this.displayedContent)
    this.linkifiedContent = this.linkifyContent(this.displayedContent)
    this.getAuthor();
    this.getRelatedEventsAndSegregate();
    this.getImageUrls();
    this.getVideoUrls();
    this.getOnlineVideoUrls();
  }

  showComments(){
    this.showingComments = true;
  }

  hideComments(){
    this.showingComments = false;
  }

  openQuotedEvent(mouseEvent: any){
    mouseEvent.stopPropagation();
    mouseEvent.preventDefault();
    this.router.navigateByUrl('n/'+this.event?.id)
  }

  async getRelatedEventsAndSegregate(){
    if(this.event){
      this.loadingRelatedEvents = true;
      let relatedEvents = await this.ndkProvider.getRelatedEventsOfNote(this.event);
      if(relatedEvents){
        for (let event of relatedEvents) {
          if(event.kind === 1){
            this.replies = [event, ...this.replies];
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

  sanitiseUrl(url:string):SafeUrl{
    var modifiedUrl = url;
    if(url.indexOf("youtube.com")>0){
      modifiedUrl = url.replace("watch?v=", "embed/");
    }

    return this.domSanitizer.bypassSecurityTrustResourceUrl(modifiedUrl)
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

  replaceNoteMentionsWithComponents(content?:string): string|undefined{
    let displayedContent = content;
    if(displayedContent){
      var matches = displayedContent.matchAll(NOSTR_NOTE_REGEX);
      for(let match of matches){
        try{
          let noteId = match[1];
          displayedContent = displayedContent.replaceAll(match[0],`<app-quoted-event id="${noteId}"></app-quoted-event>`)
        }catch(e){
          console.error(e);
        }
      }
    }
    return displayedContent;
  }

  async share(){
    var url = "https://zapddit.com/n/"+ this.event?.id
    if(navigator.share){
      navigator
      .share({
          url: url
      })
      .then(() => console.log('Successful share! 🎉'))
      .catch(err => console.error(err));
    }else{
      this.clipboard.copy(url);
      console.log("copied");
    }
  }

  async getAuthor() {
    let authorPubKey = this.event?.pubkey;
    if (authorPubKey) {
      this.canLoadMedia = (await this.dbService.peopleIFollow.where({hexPubKey:authorPubKey.toString()}).toArray()).length > 0;
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

  getVideoUrls():RegExpMatchArray | null | undefined {
    const urlRegex = /https:.*?\.(?:webm|mp4)/gi;

    const videoUrlsArray = this.event?.content.match(urlRegex);

    videoUrlsArray?.forEach(url => {
      this.videoUrls.set(url, url?.split('.').pop());
    });

    return videoUrlsArray;
  }

  getOnlineVideoUrls(){
    // Extract YouTube watch URLs
    this.extractUrls(this.event?.content, this.youtubeRegex);

    // Extract Vimeo URLs
    this.extractUrls(this.event?.content, this.vimeoRegex);

    // Extract Dailymotion URLs
    this.extractUrls(this.event?.content, this.dailymotionRegex);
  }

  extractUrls(text: string | undefined, regex: RegExp) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text!)) !== null) {
      const videoUrl = match[0];
      if(videoUrl){
        this.onlineVideoUrls.push(videoUrl);
      }
    }
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
