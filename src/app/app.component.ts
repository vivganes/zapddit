import { Component, ComponentRef, OnInit, OnDestroy } from '@angular/core';
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
  starIcon
} from '@cds/core/icon';
import { NdkproviderService } from './service/ndkprovider.service';
import { Router } from '@angular/router';
import { NDKTag, NDKUserProfile } from '@nostr-dev-kit/ndk';
import * as linkify from 'linkifyjs';
import hashtag from './util/IntlHashtagLinkifyPlugin';
import { Constants } from './util/Constants';
import { Subscription, BehaviorSubject } from 'rxjs';
import { CommunityService } from './service/community.service';
import { TopicService } from './service/topic.service';
import { Community } from './model/community';
import {
  BreakpointObserver,
  BreakpointState
} from '@angular/cdk/layout';

ClarityIcons.addIcons(starIcon,internetOfThingsIcon,thumbsUpIcon,heartIcon, thumbsDownIcon, floppyIcon, noteIcon, userIcon, boltIcon, plusCircleIcon, logoutIcon, hashtagIcon, homeIcon, cogIcon, usersIcon, sunIcon, moonIcon, searchIcon, keyIcon, copyIcon,imageIcon, trashIcon, shareIcon, chatBubbleIcon, paperclipIcon, wandIcon, downloadCloudIcon, uploadCloudIcon);
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy{
  title = 'zapddit';
  private router: Router;
  followedTopics: string[] = [];
  darkTheme: boolean = false;
  wizardIsOpen: boolean = false;
  isNip05Verified:boolean = false;
  isNip05VerifiedForAuthorSub:Subscription = new Subscription();
  followedTopicsEmitterSub:Subscription = new Subscription();
  isMobileScreen:boolean = false;
  showConfirmation:boolean = false;
  loggedInWithNsec:boolean =false;

  constructor(public ndkProvider: NdkproviderService, router: Router,
    private breakpointObserver: BreakpointObserver, private communityService:CommunityService, private topicService:TopicService) {

    this.router = router;
    linkify.registerPlugin('international-hashtags', hashtag);

  }

  ngOnInit() :void{
    this.ndkProvider.isLoggedInUsingPubKey$.subscribe(val => {
      this.loggedInWithNsec=!val;
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
      this.setTheme(false);
    }
    this.setFollowedTopicsFromString(this.ndkProvider.appData.followedTopics);

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

    this.ndkProvider.appDataEmitter.subscribe(data=>{
      var migrated = localStorage.getItem(Constants.MIGRATED)?  localStorage.getItem(Constants.MIGRATED) :"false";
      if(this.loggedInWithNsec && data){
        this.showConfirmationDialog();
      }
    })
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

  ngOnDestroy():void{
    this.followedTopicsEmitterSub.unsubscribe();
    this.isNip05VerifiedForAuthorSub.unsubscribe();
  }

  async showConfirmationDialog(){
      this.showConfirmation = true;
  }

  async onConfirmation($event:any){
    this.showConfirmation = false;

    await this.migrate();

    this.postMigrate();
  }

  async migrate(){
    var event = this.ndkProvider.createNDKEvent();
    let tags: NDKTag[] = [];

    var communities = await this.migrateCommunites(tags);
    var topics = await this.migrateTopics(tags);
    var mutedTopics = await this.migrateMutedTopics(tags);
    var recipients = await this.migrateDownzapRecipients(tags);

    event.tags = tags;
    event.kind = 30001;

    await event.sign();
    await event.publish();

    localStorage.setItem(Constants.DOWNZAPRECIPIENTS, recipients.join(','));
    this.ndkProvider.appData.downzapRecipients = recipients.join(',');

    var followedCommunites = communities.map(i=>i.id).join(',');
    localStorage.setItem(Constants.FOLLOWEDCOMMUNITIES,followedCommunites);
    this.ndkProvider.appData.followedCommunities = followedCommunites;
    this.ndkProvider.followedCommunitiesEmitter.emit(followedCommunites);

    var followedTopics = topics.join(',');
    localStorage.setItem(Constants.FOLLOWEDTOPICS,followedTopics);
    this.ndkProvider.appData.followedTopics = followedTopics;
    this.ndkProvider.followedTopicsEmitter.emit(followedTopics);

    var mTopics = mutedTopics.join(',');
    localStorage.setItem(Constants.MUTEDTOPICS,mTopics);
    this.ndkProvider.appData.mutedTopics = mTopics;
    this.ndkProvider.mutedTopicsEmitter.emit(mTopics);
  }

  async migrateCommunites(tags:NDKTag[]){
    // get from the appspecific data
    var existingCommunities = this.ndkProvider.appData.followedCommunities.split(',');
    var joinedCommunities:Community[] = [];

    for(let item of existingCommunities){
      joinedCommunities.push({id:item});
    }

    //retrieve existing communities from interoperable list
    var collatedCommunites = await this.communityService.fetchJoinedCommunitiesMetadata() || [];
    collatedCommunites.push(...joinedCommunities);

    //de-duplicate entries
    collatedCommunites = collatedCommunites.reduce((accumulator:Community[], current:Community) => {
      if (!accumulator.find((item) => item.id === current.id)) {
        accumulator.push(current);
      }
      return accumulator;
    }, []);

    if(collatedCommunites.length>0)
      tags.push(['d', 'communities']);

    for(let item of collatedCommunites){
      if(item.id)
        tags.push(['a',`${item.id}`])
    }

    return collatedCommunites;
  }

  async migrateTopics(tags:NDKTag[]){
    // get topics from the appspecific data
    var topics = this.ndkProvider.appData.followedTopics.split(',');
    var joinedTopics:string[] = [];

    for(let item of topics){
      joinedTopics.push(item);
    }

    //retrieve existing topics from interoperable list
    var collatedTopics = await this.topicService.fetchFollowedTopics() || [];
    collatedTopics.push(...joinedTopics);

    //de-duplicate
    collatedTopics = [...new Set(collatedTopics)];

    if(collatedTopics.length>0)
      tags.push(['d', 'hashtags']);

    for(let item of collatedTopics){
      if(item)
        tags.push(['t',`${item}`])
    }

    return collatedTopics;
  }

  async migrateMutedTopics(tags:NDKTag[]){
     // get muted topics from the appspecific data
     var existingMutedTopics = this.ndkProvider.appData.mutedTopics.split(',');
     var mutedTopics:string[] = [];

     for(let item of existingMutedTopics){
       mutedTopics.push(item);
     }

     var collatedMutedTopics = await this.topicService.fetchMutedTopics() || [];
     collatedMutedTopics.push(...mutedTopics);

    //de-duplicate
    collatedMutedTopics = [...new Set(collatedMutedTopics)];

     if(collatedMutedTopics.length>0)
       tags.push(['d', 'mutehashtags']);

     for(let item of collatedMutedTopics){
       if(item)
         tags.push(['t',`${item}`])
     }

     return collatedMutedTopics;
  }

  async migrateDownzapRecipients(tags:NDKTag[]){
    var downzapRecipients = this.ndkProvider.appData.downzapRecipients.split(',');
    var recipients:string[]=[];

    for(let item of downzapRecipients){
      recipients.push(item);
    }

    recipients = [...new Set(recipients)]

    if(recipients.length>0)
     tags.push(['d', 'downzaprecipients']);

    for(let item of recipients){
      if(item)
        tags.push(['p',`${item}`])
    }

    return recipients;
  }

  postMigrate(followListCsv?: string, downzapRecipients?: string, mutedTopics?: string, followedCommunitiesCsv?:string){
    this.ndkProvider.publishAppData(undefined,undefined, undefined, undefined, true);
  }
}
