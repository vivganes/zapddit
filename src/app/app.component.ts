import { Component, ComponentRef } from '@angular/core';
import '@cds/core/icon/register.js';
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
  wandIcon
} from '@cds/core/icon';
import { NdkproviderService } from './service/ndkprovider.service';
import { Router } from '@angular/router';
import { NDKUserProfile } from '@nostr-dev-kit/ndk';
import * as linkify from 'linkifyjs';
import hashtag from './util/IntlHashtagLinkifyPlugin';
import { Constants } from './util/Constants';


ClarityIcons.addIcons(userIcon, boltIcon, plusCircleIcon, logoutIcon, hashtagIcon, homeIcon, cogIcon, usersIcon, sunIcon, moonIcon, searchIcon, keyIcon, copyIcon,imageIcon, trashIcon, shareIcon, chatBubbleIcon, paperclipIcon, wandIcon);
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'zapddit';
  private router: Router;
  followedTopics: string[] = [];
  darkTheme: boolean = false;
  wizardIsOpen: boolean = false;
  isNip05Verified:boolean = false;

  ndkProvider: NdkproviderService;

  constructor(ndkProvider: NdkproviderService,router: Router) {
    this.ndkProvider = ndkProvider;
    this.router = router;
    linkify.registerPlugin('international-hashtags', hashtag);

  }

  ngOnInit() {
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

    this.ndkProvider.followedTopicsEmitter.subscribe((followedTopics: string) => {
      if (followedTopics === '') {
        this.followedTopics = [];
      } else {
        this.followedTopics = followedTopics.split(',');
      }
    });

    this.ndkProvider.launchOnboardingWizard.subscribe((launch:boolean)=>{
      this.wizardIsOpen = launch;
    })

    this.ndkProvider.isNip05Verified$.subscribe(val=>{
      this.isNip05Verified = val
    });
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

  searchFromMobile() {
    let topic = (<HTMLInputElement>document.getElementById('search_input_mobile')).value;
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
}
