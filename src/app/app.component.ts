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
  logoutIcon
} from '@cds/core/icon';
import { NdkproviderService } from './service/ndkprovider.service';
import { Router } from '@angular/router';
import { NDKUserProfile } from '@nostr-dev-kit/ndk';
import * as linkify from 'linkifyjs';
import hashtag from './util/IntlHashtagLinkifyPlugin';


ClarityIcons.addIcons(userIcon, boltIcon, plusCircleIcon, logoutIcon, hashtagIcon, homeIcon, cogIcon, usersIcon, sunIcon, moonIcon, searchIcon);
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'ZappedIt!';
  private router: Router;
  followedTopics: string[] = [];
  darkTheme: boolean = false;


  ndkProvider: NdkproviderService;

  constructor(ndkProvider: NdkproviderService,router: Router) {
    this.ndkProvider = ndkProvider;
    this.router = router;
    linkify.registerPlugin('international-hashtags', hashtag);

  }

  ngOnInit() {    
    var themeFromLocal = localStorage.getItem('darkTheme');
    if(themeFromLocal && themeFromLocal!==null && themeFromLocal!==''){
      if(themeFromLocal === 'false'){
        this.setTheme(false);
      } else {
        this.setTheme(true);
      }
    }
    else {
      console.log('no value in localstorage')
      this.setTheme(false);
    }

    this.ndkProvider.followedTopicsEmitter.subscribe((followedTopics: string) => {
      if (followedTopics === '') {
        this.followedTopics = [];
      } else {
        this.followedTopics = followedTopics.split(',');
      }
    });
  }


  setTheme(dark:boolean){
    (<any>document.getElementById('zappedit-theme')).href="/assets/clr-ui"+(dark?"-dark":"")+".css";
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
      this.router.navigate(['t', { topic }]);
    }
  }

  searchFromMobile() {
    let topic = (<HTMLInputElement>document.getElementById('search_input_mobile')).value;
    if(topic && topic !==''){
      topic = topic.toLowerCase();
      this.router.navigate(['t', { topic }]);
    }
  }

  isLoggingIn(){
    return this.ndkProvider.loggingIn;
  }

  switchTheme(){
    this.darkTheme =!this.darkTheme;
    this.setTheme(this.darkTheme);
  }

  logout(){
    this.ndkProvider.logout();
  }
}
