import { Component, ElementRef, Input, ViewChild, Renderer2, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef, SecurityContext } from '@angular/core';
import { NDKEvent, NDKTag, NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import linkifyHtml from 'linkify-html';
import QRCodeStyling from 'qr-code-styling';
import { ZappeditdbService } from '../../service/zappeditdb.service';
import { Constants } from 'src/app/util/Constants';
import { Util } from 'src/app/util/Util';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Clipboard } from '@angular/cdk/clipboard';
import { LoginUtil } from 'src/app/util/LoginUtil';
import { Subscription, BehaviorSubject } from 'rxjs';

const MENTION_REGEX = /(#\[(\d+)\])/gi;
const NOSTR_NPUB_REGEX = /nostr:(npub[\S]*)/gi;
const NOSTR_NOTE_REGEX = /nostr:(note1[\S]*)/gi;

const NOSTR_EVENT_REGEX = /nostr:(nevent1[\S]*)/gi;

export interface OnlineVideo {
  type:string;
  url:SafeUrl;
}

@Component({
  selector: 'app-event-card',
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss'],
})
export class EventCardComponent implements OnInit, OnDestroy{
  // Regular expression patterns to match video URLs
  //private readonly youtubeRegex:RegExp =  /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/gm;
  private readonly youtubeRegex:RegExp = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/gms
  private readonly vimeoRegex:RegExp = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/g;
  private readonly dailymotionRegex:RegExp = /(?:https?:\/\/)?(?:www\.)?dailymotion\.com\/video\/([\w-]+)/g;

  @Input()
  event: NDKEvent | undefined;
  @Input()
  showingComments: boolean = false;
  @Input()
  isQuotedEvent: boolean = false;
  @Input()
  peopleIFollowLoadedFromRelay: boolean = false;

  SecurityContext = SecurityContext;
  nip05Address:string | undefined;
  mutedAuthor:boolean = false;
  authorWithProfile: NDKUser | undefined;
  canLoadMedia:boolean = false;
  amIFollowingtheAuthor:boolean  = false;
  imageUrls: RegExpMatchArray | null | undefined;
  videoUrls: Map<string,string|undefined> = new Map<string,string|undefined>();
  onlineVideoUrls:OnlineVideo[] = [];
  zaps: Set<NDKEvent> = new Set<NDKEvent>();
  replies: NDKEvent[] = [];
  likes:number = 0
  dislikes:number = 0
  upZapTotalMilliSats: number = 0
  downZapTotalMilliSats: number = 0
  showQR: boolean= false;
  invoice:string|null=null;
  @ViewChild("canvas")
  canvas: ElementRef | undefined;
  linkifiedContent:string|undefined;
  loadingRelatedEvents:boolean = false;
  blurImageId:any = Math.floor(Math.random() * (5)) + 1;;
  hashTagsMap:Map<number,string> = new Map<number,string>();
  showMediaFromPeopleIFollow:boolean = true;
  linkCopied:boolean = false;
  authorHexPubKey:string|undefined ='';
  eventInProgress:boolean = false;
  loggedInWithNsec:boolean =false;
  notTheLoggedInUser:boolean = false;
  fetchingMutedUsersFromRelaySub:Subscription = new Subscription();
  isNIP05Verified:boolean = false;
  upzappingNow:boolean = false;
  downzappingNow:boolean = false;
  errorMsg?:string;
  @ViewChild("parent")
  parent: ElementRef;

  @Input()
  downZapEnabled: boolean | undefined;

  hideNonZapReactions: boolean = false;

  ndkProvider: NdkproviderService;
  displayedContent: string|undefined;

  constructor(ndkProvider: NdkproviderService, private renderer: Renderer2,
    private dbService: ZappeditdbService, private router:Router, public domSanitizer:DomSanitizer,
      private clipboard: Clipboard, private changeDetector:ChangeDetectorRef) {
    this.ndkProvider = ndkProvider;
    var mediaSettings = localStorage.getItem(Constants.SHOWMEDIA)
    if(mediaSettings!=null || mediaSettings!=undefined || mediaSettings!=''){
      this.showMediaFromPeopleIFollow = Boolean(JSON.parse(mediaSettings!));
    }
    var hideNonZapReactionsFromLocal = localStorage.getItem(Constants.HIDE_NONZAP_REACTIONS)
    if(hideNonZapReactionsFromLocal && hideNonZapReactionsFromLocal === 'true'){
      this.hideNonZapReactions = true;
    }
  }

  ngOnInit():void {
    this.displayedContent = this.replaceHashStyleMentionsWithComponents();
    this.displayedContent = this.replaceNpubMentionsWithComponents(this.displayedContent)
    this.displayedContent = this.replaceNoteMentionsWithComponents(this.displayedContent)
    this.displayedContent = this.replaceNEventMentionsWithComponents(this.displayedContent)
    this.linkifiedContent = this.linkifyContent(this.displayedContent)
    this.getAuthor();
    this.getRelatedEventsAndSegregate();
    this.getImageUrls();
    this.getVideoUrls();
    this.getOnlineVideoUrls();

    this.ndkProvider.isLoggedInUsingPubKey$.subscribe(val => {
      this.loggedInWithNsec=!val;
    })

    this.fetchingMutedUsersFromRelaySub = this.ndkProvider.fetchingMutedUsersFromRelay$.subscribe(val=>{
      if(val.status===false && val.count>0){
        this.getAuthor();
      }
    })
  }

  ngAfterViewInit(): void {
    setTimeout(()=>this.initYouTubeVideos(),3000);
  }

  addReply(reply: NDKEvent){
    this.replies = [...this.replies, reply];
  }

  showComments(){
    this.showingComments = true;
  }

  hideComments(){
    this.showingComments = false;
  }

  openQuotedEvent(mouseEvent: any){
    mouseEvent.stopImmediatePropagation();
    mouseEvent.preventDefault();
    this.router.navigateByUrl('n/'+this.event?.id)
  }

  async getRelatedEventsAndSegregate(){
    if(this.event){
      let currentEvent = this.event;
      this.loadingRelatedEvents = true;
      let relatedEvents = await this.ndkProvider.getRelatedEventsOfNote(this.event);
      if(relatedEvents){
        for (let event of relatedEvents) {
          if(event.kind === 1){
            let eTags:NDKTag[] = event.getMatchingTags('e');
            let replyToThisEvent = false;
            for(let tag of eTags){
              if(tag.length > 2 && tag[3] !== undefined){ // if the note uses markers
                if(tag[1] === currentEvent.id && tag[3] === 'reply')
                  {
                    replyToThisEvent = true
                  }
              } else {
                replyToThisEvent = true
              }
            }
            if(replyToThisEvent){
              this.replies = [event, ...this.replies];
            }
          } else if (event.kind === 9735){
            this.zaps.add(event);
          } else if (event.kind === 7){
            if(event.content.indexOf('-')>-1){
              this.dislikes++;
            } else {
              this.likes++;
            }
          }
          else {
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

  replaceNEventMentionsWithComponents(content?:string): string|undefined{
    let displayedContent = content;
    if(displayedContent){
      var matches = displayedContent.matchAll(NOSTR_EVENT_REGEX);
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

  copyNoteHexIdToClipboard(){
    this.clipboard.copy(this.event?.id!);
  }

  copyNote1IdToClipboard(){
    const note1Id = LoginUtil.hexToBech32('note',this.event?.id!)
    this.clipboard.copy(note1Id);
  }

  async publishLike(){
    await this.ndkProvider.publishReactionToEvent(this.event!,'+');
    this.likes++;
  }

  async publishDislike(){
    await this.ndkProvider.publishReactionToEvent(this.event!,'-');
    this.dislikes++;
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
      this.linkCopied =true;

      setTimeout(()=>{
        this.linkCopied = false;
      }, 3000)
    }
  }

  async getAuthor() {
    let authorPubKey = this.authorHexPubKey = this.event?.pubkey;
    this.authorWithProfile = await this.ndkProvider.getNdkUserFromHex(authorPubKey!);
    await this.ndkProvider.getProfileFromHex(this.event?.pubkey!);
    this.nip05Address = this.authorWithProfile?.profile?.nip05;
    this.changeDetector.detectChanges();
    if (authorPubKey) {
      var loggedInUserHexPubKey = this.ndkProvider.currentUser?.hexpubkey();

      this.dbService.peopleIFollow.where({hexPubKey:authorPubKey.toString()}).count().then(async count=>{
          this.amIFollowingtheAuthor = count > 0;
          if(this.showMediaFromPeopleIFollow){
            this.canLoadMedia = count > 0;
          }

          // we do not want to override this flag, if user already clicked the media to view
          if(this.showMediaFromPeopleIFollow && !this.canLoadMedia){
            this.canLoadMedia = count > 0;
          }

          if(loggedInUserHexPubKey === this.authorHexPubKey){
            this.canLoadMedia =  true;
          }
      })

      this.dbService.mutedPeople.where({hexPubKey:authorPubKey.toString()}).count().then(count=>{
        this.mutedAuthor = count > 0;
      })

      this.notTheLoggedInUser = authorPubKey !== this.ndkProvider.currentUser?.hexpubkey();
    }
    if(this.nip05Address)
      this.isNIP05Verified = await this.ndkProvider.checkIfNIP05Verified(this.nip05Address, this.authorHexPubKey);

    this.changeDetector.detectChanges();
  }

  getNthTag( n:number):string{
    const tags:NDKTag[]|undefined = this.event?.tags;
    if(tags){
     return tags[n][1];
    }
    return '';
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
    const urlRegex = /https:.*?\.(?:webm|mp4|mov)/gi;

    const videoUrlsArray = this.event?.content.match(urlRegex);

    videoUrlsArray?.forEach(url => {
      if(url.indexOf(".mov") >=0)
      this.videoUrls.set(url, "mp4");
      else
        this.videoUrls.set(url, url?.split('.').pop());
    });

    return videoUrlsArray;
  }

  getOnlineVideoUrls(){
    // Extract YouTube watch URLs
    this.extractUrls(this.event?.content, this.youtubeRegex, "youtube");

    // Extract Vimeo URLs
    this.extractUrls(this.event?.content, this.vimeoRegex, "vimeo");

    // Extract Dailymotion URLs
    this.extractUrls(this.event?.content, this.dailymotionRegex,"dailymotion");
  }

  extractUrls(text: string | undefined, regex: RegExp, type:string) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text!)) !== null) {
      const videoUrl = match[0];
      if(videoUrl){
        this.onlineVideoUrls.push({type:type, url:this.sanitiseUrl(videoUrl)});
      }
    }
  }

  youTubeGetID(url:SafeUrl){
    var urlParts = this.domSanitizer.sanitize(SecurityContext.URL,url)!.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    return (urlParts[2] !== undefined) ? urlParts[2].split(/[^0-9a-z_\-]/i)[0] : urlParts[0];
  }

  getSafeUrlAsString(url:string):string{
    return this.domSanitizer.sanitize(SecurityContext.URL, this.sanitiseUrl(url))!
  }

  replaceWithIframe(div:any) {
    var iframe = document.createElement('iframe');
    var id = div.dataset.id;
    var url = 'https://www.youtube.com/embed/' + id + '?autoplay=1';
    iframe.setAttribute('src', this.getSafeUrlAsString(url));
    // applying styles using class doesnt reflect in the dom for some reason when the iframe is dynamically added,
    // hence we add it here on style attribute directly
    iframe.setAttribute('style',`width: 100%; aspect-ratio: 16/9;`)
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '1');
    iframe.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture');
    div.parentNode.replaceChild(iframe, div);
  }

  hasYoutubeVids(){
    return (this.onlineVideoUrls!=null && this.onlineVideoUrls?.filter(i=>i.type==="youtube")?.length>0)
  }

  initYouTubeVideos() {
    if((!this.showMediaFromPeopleIFollow) || (this.showMediaFromPeopleIFollow && this.hasYoutubeVids() && this.canLoadMedia)){
      var playerElements = this.parent.nativeElement.querySelectorAll('.youtube-player');
      for (var n = 0; n < playerElements.length; n++) {
        var element:any =playerElements[n];
        var videoId = element.id;
        var div = document.createElement('div');
        div.setAttribute('data-id', videoId);
        var thumbNode = document.createElement('img');
        thumbNode.src = '//i.ytimg.com/vi/ID/hqdefault.jpg'.replace('ID', videoId);
        div.appendChild(thumbNode);
        var playButton = document.createElement('div');
        playButton.setAttribute('class', 'play');
        div.appendChild(playButton);
        var that = this;
        div.onclick = function () {
          that.replaceWithIframe(this);
        };
        playerElements[n].appendChild(div);
      }
    }
  }

  clickToLoadMedia(){
    this.canLoadMedia = true;
    setTimeout(()=>this.initYouTubeVideos(),3000);

  }

  async upZap() {
    this.upzappingNow = true;
    try{
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
    }catch(e:any){
      this.errorMsg = e.message;
    }finally{
      this.upzappingNow = false;
    }
  }

  isDownzapEnabled(): boolean {
    return this.ndkProvider.appData.downzapRecipients !== '';
  }

  openWallet(){
    window.open(`lightning:${this.invoice}`,"_blank");
  }

  copyInvoiceToClipboard(){
    this.clipboard.copy(this.invoice!);
  }

  async downZap() {
    this.downzappingNow = true;
    try{
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
    }catch(e:any){
      this.errorMsg = e.message;
    }finally{
      this.downzappingNow = false;
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

  async fetchReactionsAndSegregate(){
    if (this.event) {
      let reactions = await this.ndkProvider.fetchReactions(this.event);
      if(reactions){
        this.dislikes = this.likes = 0;
        for(let reaction of reactions){
          if(reaction.content.indexOf('-')>-1){
            this.dislikes++;
          } else {
            this.likes++;
          }
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
  return (this.imageUrls!=null && this.imageUrls?.length > 0) || (this.videoUrls!=null && this.videoUrls?.size > 0) || (this.onlineVideoUrls!=null && this.onlineVideoUrls?.length > 0)
 }

 follow(){
  this.eventInProgress = true;

  this.ndkProvider.followUnfollowContact(this.authorHexPubKey!, true).then(async res=>{
    // allow the data to be propagated on the relays and then look for the change in local and relay contacts
    setTimeout(async () =>
    {
      this.ndkProvider.fetchFollowersFromCache().then(()=>{
        // wait for the user to be persisted in the db and then re-check to enable the media based on followed/unfollowed state
        setTimeout(()=>{
          this.eventInProgress = false;
        },10000);
      })
    },10000);
  }, err=>{
    console.log(err);
    this.eventInProgress = false;
  }).catch((error)=> {
    this.eventInProgress = false;
    console.error ("Error from follow: " + error);
  });
 }

 unFollow(){
  this.eventInProgress = true;
  this.ndkProvider.followUnfollowContact(this.authorHexPubKey!, false).then(async res => {
    this.dbService.peopleIFollow.where('hexPubKey').equalsIgnoreCase(this.authorHexPubKey!.toString()).delete().then(()=>{
      console.log("Contact removed")
      this.getAuthor();
      this.eventInProgress = false;
    })
  }, err=>{
    console.log(err);
    this.eventInProgress = false;
  }).catch((error)=> {
    this.eventInProgress = false;
    console.error ("Error from unfollow: " + error);
  });
 }

 ngOnDestroy(): void {
  this.fetchingMutedUsersFromRelaySub.unsubscribe();
 }
}
