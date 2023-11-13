import { Component, OnInit, OnDestroy} from '@angular/core';
import {TranslateService} from "@ngx-translate/core";

import '@cds/core/icon/register.js';
// import {} from '@cds/core';
import {
  ClarityIcons,
  userIcon,
  boltIcon,
  plusCircleIcon,
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
import { Router } from '@angular/router';
import { NDKEvent, NDKTag, NDKUserProfile } from '@nostr-dev-kit/ndk';
import * as linkify from 'linkifyjs';
import hashtag from './util/IntlHashtagLinkifyPlugin';
import { Constants } from './util/Constants';
import { Subscription, BehaviorSubject } from 'rxjs';
import { CommunityService } from './service/community.service';
import { TopicService } from './service/topic.service';
import {
  BreakpointObserver,
  BreakpointState
} from '@angular/cdk/layout';
import { BtcConnectService } from './service/btc-connect.service';

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
  darkTheme: boolean = false;
  wizardIsOpen: boolean = false;
  isNip05Verified:boolean = false;
  isNip05VerifiedForAuthorSub:Subscription = new Subscription();
  followedTopicsEmitterSub:Subscription = new Subscription();
  isMobileScreen:boolean = false;
  codePopupOpened:boolean = false;
  currentLanguage:string;

  constructor(private translate: TranslateService, public ndkProvider: NdkproviderService, router: Router,
    private breakpointObserver: BreakpointObserver, private communityService:CommunityService, private topicService:TopicService, private btcConnectService:BtcConnectService) {
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
      this.setTheme(false);
    }
    this.ndkProvider.loginCompleteEmitter.subscribe((loginComplete:boolean)=>{
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
        console.log("larger than mobile")
      } else {
        this.isMobileScreen = true;
        console.log("mobile")
      }
    });
  }


  private setFollowedTopicsFromString(followedTopics: string) {
    if (followedTopics === '') {
      this.followedTopics = [];
    } else {
      this.followedTopics = followedTopics.split(',');
    }
  }

  setTheme(dark:boolean){
    if((document.getElementById('zapddit-theme'))){
      (<any>document.getElementById('zapddit-theme')).href="/assets/clr-ui"+(dark?"-dark":"")+".css";
    }
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
    if(topic && topic !==''){
      topic = topic.toLowerCase();
      if(topic.startsWith('#')){
        topic = topic.slice(1);
      }
      this.router.navigate(['t', { topic }]);
    }
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
    this.followedTopicsEmitterSub.unsubscribe();
    this.isNip05VerifiedForAuthorSub.unsubscribe();
  }
}
