import { Component, OnInit, OnDestroy, Inject, ComponentRef} from '@angular/core';
import {TranslateService} from "@ngx-translate/core";

import '@cds/core/icon/register.js';
// import {} from '@cds/core';
import {
  ClarityIcons,
  userIcon,
  boltIcon,
  plusCircleIcon,
  minusCircleIcon,
  hashtagIcon,
  homeIcon,
  usersIcon,
  cogIcon,
  sunIcon,
  moonIcon,
  searchIcon,
  logoutIcon,
  keyIcon,
  copyIcon,
  imageIcon,
  trashIcon,
  shareIcon,
  chatBubbleIcon,
  paperclipIcon,
  wandIcon,
  noteIcon,
  floppyIcon,
  heartIcon,
  thumbsDownIcon,
  thumbsUpIcon,
  downloadCloudIcon,
  uploadCloudIcon,
  internetOfThingsIcon,
  starIcon,
  flagIcon,
  arrowIcon,
  bubbleExclamationIcon,
  bitcoinIcon,
  connectIcon
} from '@cds/core/icon';
import { NdkproviderService } from './service/ndkprovider.service';
import { ActivatedRoute, NavigationEnd, RouteReuseStrategy, Router } from '@angular/router';
import { NDKEvent, NDKTag, NDKUserProfile } from '@nostr-dev-kit/ndk';
import * as linkify from 'linkifyjs';
import hashtag from './util/IntlHashtagLinkifyPlugin';
import { Constants } from './util/Constants';
import { Subscription, BehaviorSubject, filter } from 'rxjs';
import { CommunityService } from './service/community.service';
import { TopicService } from './service/topic.service';
import {
  BreakpointObserver,
  BreakpointState
} from '@angular/cdk/layout';
import { BtcConnectService } from './service/btc-connect.service';
import { DOCUMENT } from '@angular/common';
import { ZapdditRouteReuseStrategy } from './util/ZapdditRouteReuseStrategy';
import { EventFeedComponent } from './component/event-feed/event-feed.component';
import { ToastService } from 'angular-toastify';
import { ZapSplitUtil } from './util/ZapSplitUtil';

ClarityIcons.addIcons(
  connectIcon,
  bitcoinIcon,
  flagIcon,
  bubbleExclamationIcon,
  starIcon,
  internetOfThingsIcon,
  thumbsUpIcon,
  heartIcon,
  thumbsDownIcon,
  floppyIcon,
  noteIcon,
  userIcon,
  boltIcon,
  plusCircleIcon,
  minusCircleIcon,
  logoutIcon,
  hashtagIcon,
  homeIcon,
  cogIcon,
  usersIcon,
  sunIcon,
  moonIcon,
  searchIcon,
  keyIcon,
  copyIcon,
  imageIcon,
  trashIcon,
  shareIcon,
  chatBubbleIcon,
  paperclipIcon,
  wandIcon,
  downloadCloudIcon,
  uploadCloudIcon
);
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy{
  title = 'zapddit';
  private router: Router;
  sidebarCollapsed: false;
  followedTopics: string[] = [];
  darkTheme: boolean = true;
  wizardIsOpen: boolean = false;
  isNip05Verified:boolean = false;
  isNip05VerifiedForAuthorSub:Subscription = new Subscription();
  followedTopicsEmitterSub:Subscription = new Subscription();
  isMobileScreen:boolean = false;
  codePopupOpened:boolean = false;
  currentLanguage:string;
  notices:string[] =[];
  previousUrl: string | null= null;
  currentUrl: string | null= null;

  constructor(private translate: TranslateService, public ndkProvider: NdkproviderService, router: Router,
    private breakpointObserver: BreakpointObserver, private communityService:CommunityService,
    private topicService:TopicService, private btcConnectService:BtcConnectService, @Inject(DOCUMENT) private document: Document,
    private routeStrategy:RouteReuseStrategy, private _toastService: ToastService) {
    translate.setDefaultLang('en');

    var language = localStorage.getItem(Constants.LANGUAGE);
    if (language != null || language != undefined || language != '') {
      this.currentLanguage = language as string;
      this.translate.use(this.currentLanguage || 'en')
    } else {
      localStorage.setItem(Constants.LANGUAGE,'en');
      this.currentLanguage = 'en';
    }
    this.router = router;
    linkify.registerPlugin('international-hashtags', hashtag);

  }

  ngOnInit() :void{
    window.addEventListener('scroll', this.scrollEvent, true);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd))
      .subscribe(event =>
     {
        this.currentUrl = (event as NavigationEnd).url;
        console.log('scroll '+ this.currentUrl);
     });

    this.ndkProvider.notice$.subscribe((message)=> {
      console.log("NOTICE: "+ message);
      this.notices.push(message);
    })

   
    var mediaSetting = localStorage.getItem(Constants.SHOWMEDIA);
    if(!mediaSetting){
      localStorage.setItem(Constants.SHOWMEDIA,'true');
    }
    var themeFromLocal = localStorage.getItem(Constants.DARKTHEME);
    if(themeFromLocal && themeFromLocal!==null && themeFromLocal!==''){
      if(themeFromLocal === 'false'){
        this.setTheme(false);
      } else {
        this.setTheme(true);
      }
    }
    else {
      this.setTheme(true);
    }
    this.ndkProvider.loginCompleteEmitter.subscribe((loginComplete:boolean)=>{      
      this.showZapSplitToastIfNecessary();  
      this.topicService.fetchFollowedTopics().then(res=>{
            this.setFollowedTopicsFromString(res.join(','));
      })
    })


    this.followedTopicsEmitterSub =  this.ndkProvider.followedTopicsEmitter.subscribe((followedTopics: string) => {
      this.setFollowedTopicsFromString(followedTopics);
    });

    this.ndkProvider.launchOnboardingWizard.subscribe((launch:boolean)=>{
      this.wizardIsOpen = launch;
    })

    this.isNip05VerifiedForAuthorSub = this.ndkProvider.isNip05Verified$.subscribe(val=>{
      this.isNip05Verified = val
    });

    this.breakpointObserver
    .observe(['(min-width: 450px)'])
    .subscribe((state: BreakpointState) => {
      if (state.matches) {
        this.isMobileScreen = false;
      } else {
        this.isMobileScreen = true;
      }
    });

  }

  scrollEvent = (event: any): void => {
    if(this.currentUrl === Constants.FEED_ROUTE || this.currentUrl ===  Constants.INDEX_ROUTE){
      const scrollTop = event.srcElement.scrollTop;
      sessionStorage.setItem('feedPageScrollPos',scrollTop);
    }
  }

  private showZapSplitToastIfNecessary() {
    var zapSplitPercentageText = localStorage.getItem(Constants.ZAP_SPLIT_PERCENTAGE);
    var zapSplitConfigText = localStorage.getItem(Constants.ZAP_SPLIT_CONFIG);
    if (zapSplitConfigText !== null && zapSplitConfigText !== undefined && zapSplitConfigText !== '') {
      //zap split config already exists. No need to do anything.
      localStorage.removeItem(Constants.ZAP_SPLIT_PERCENTAGE)
    }
    else if (zapSplitPercentageText !== null && zapSplitPercentageText !== undefined && zapSplitPercentageText !== '') {
      //some value is there. no need to show toast.
      //migrate to new zap split config format
      const zapSplitConfig = ZapSplitUtil.prepareDefaultZapSplitConfig();
      const zapdditDev = zapSplitConfig.developers.filter((d)=> d.hexKey === Constants.ZAPDDIT_PUBKEY)
      zapdditDev[0].percentage = Number.parseFloat(zapSplitPercentageText);
      console.log(zapSplitConfig);
      localStorage.setItem(Constants.ZAP_SPLIT_CONFIG, JSON.stringify(zapSplitConfig));
      localStorage.removeItem(Constants.ZAP_SPLIT_PERCENTAGE)
    } else {
      const zapSplitConfig = ZapSplitUtil.prepareDefaultZapSplitConfig();
      localStorage.setItem(Constants.ZAP_SPLIT_CONFIG, JSON.stringify(zapSplitConfig));
      this.translate.get('A default Zap split has been configured to support developers and translators, you can disable it at any time in Preferences').subscribe((res: string) => {
        this._toastService.info(res);
      });    
    }
  }

  onAttach(component:any){
    if (component instanceof EventFeedComponent)
    {
      var scrollPos = sessionStorage.getItem('feedPageScrollPos');
      if(scrollPos){
        component.setScrollPosition(scrollPos);
      }
    }
  }

  private setFollowedTopicsFromString(followedTopics: string) {
    if (followedTopics === '') {
      this.followedTopics = [];
    } else {
      this.followedTopics = followedTopics.split(',');
    }
  }

  setTheme(dark:boolean){
    this.document.body.setAttribute('cds-theme',(dark?'dark':'light'))
    this.darkTheme = dark;
  }

  openWizard(){
    this.wizardIsOpen = true;
  }

  isTopicFollowed(topic: string): boolean {
    if (this.followedTopics.indexOf(topic) > -1) {
      return true;
    }
    return false;
  }

  isLoggedIn(): boolean {
    return this.ndkProvider.isLoggedIn();
  }

  getCurrentUserProfile(): NDKUserProfile | undefined {
    return this.ndkProvider.getCurrentUserProfile();
  }

  search() {
    let topic = (<HTMLInputElement>document.getElementById('search_input')).value;
    this.clearSavedComponentState();
    if(topic && topic !==''){
      topic = topic.toLowerCase();
      if(topic.startsWith('#')){
        topic = topic.slice(1);
      }
      this.router.navigate(['t', { topic }]);
    }
  }

  clearSavedComponentState(){
    (this.routeStrategy as ZapdditRouteReuseStrategy).clearSavedHandle(Constants.FEED_ROUTE);
  }

  isLoggingIn(){
    return this.ndkProvider.loggingIn;
  }

  switchTheme(){
    this.darkTheme =!this.darkTheme;
    this.setTheme(this.darkTheme);
    localStorage.setItem(Constants.DARKTHEME, ""+this.darkTheme);
  }

  logout(){
    this.ndkProvider.logout();
  }

  openCodePopup(){
    this.codePopupOpened = true;
  }

  ngOnDestroy():void{
    window.removeEventListener('scroll', this.scrollEvent, true);
    this.followedTopicsEmitterSub.unsubscribe();
    this.isNip05VerifiedForAuthorSub.unsubscribe();
  }
}
