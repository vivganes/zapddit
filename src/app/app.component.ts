import { Component, ComponentRef } from '@angular/core';
import '@cds/core/icon/register.js';
import {
  ClarityIcons,
  userIcon,
  boltIcon,
  plusCircleIcon,
  logoutIcon,
  hashtagIcon,
  homeIcon,
  cogIcon,
  sunIcon,
  moonIcon
} from '@cds/core/icon';
import { NdkproviderService } from './service/ndkprovider.service';
import { TopicService } from './service/topic.service';
import { EventFeedComponent } from './component/event-feed/event-feed.component';
import { Router } from '@angular/router';
import { NDKUserProfile } from '@nostr-dev-kit/ndk';

ClarityIcons.addIcons(userIcon, boltIcon, plusCircleIcon, logoutIcon, hashtagIcon, homeIcon, cogIcon, sunIcon, moonIcon);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'ZappedIt!';
  private topicService: TopicService;
  private router: Router;
  followedTopics: string[] = [];
  downzapRecipientsError: string | undefined;
  downzapSetSuccessMessage: string | undefined;
  darkTheme: boolean = true;

  ndkProvider: NdkproviderService;

  constructor(ndkProvider: NdkproviderService, topicService: TopicService, router: Router) {
    this.ndkProvider = ndkProvider;
    this.topicService = topicService;
    this.router = router;
  }

  ngOnInit() {
    var themeFromLocal = localStorage.getItem('darkTheme');
    if(themeFromLocal && themeFromLocal!==null && themeFromLocal!==''){
      if(themeFromLocal === 'false'){
        document.styleSheets[1].disabled = true;
        this.darkTheme = false
      }
    }

    this.ndkProvider.followedTopicsEmitter.subscribe((followedTopics: string) => {
      if (followedTopics === '') {
        this.followedTopics = [];
      } else {
        this.followedTopics = followedTopics.split(',');
      }
    });
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
    let topic = (<HTMLInputElement>document.getElementById('search-input-sidenav-ng')).value;    
    if(topic && topic !==''){
      topic = topic.toLowerCase();
      this.router.navigate(['t', { topic }]);
    }
  }

  setDefaultSats() {
    let sats = (<HTMLInputElement>document.getElementById('sats-for-zaps')).value;
    try{
      this.ndkProvider.setDefaultSatsForZaps(Number.parseInt(sats));
      }catch(e){
        console.error(e);
      }
  }

  async saveDownzapRecipients() {
    this.downzapRecipientsError = undefined;
    let recipients = (<HTMLInputElement>document.getElementById('downzap-recipients')).value;
    let supposedUser = await this.ndkProvider.getNdkUserFromNpub(recipients);
    if (supposedUser !== undefined) {
      this.ndkProvider.publishAppData(undefined, recipients);
      this.downzapSetSuccessMessage =
        'Sending downzaps to ' +
        (supposedUser.profile?.displayName ? supposedUser.profile?.displayName : supposedUser.profile?.name);
    } else {
      this.downzapRecipientsError = 'Invalid npub';
    }
  }

  stopPropagatingEvent(event:any){
    event.preventDefault();
    event.stopPropagation();
  }

  attemptLogin(){
    this.ndkProvider.attemptLogin();
  }

  isLoggingIn(){
    return this.ndkProvider.loggingIn;
  }

  switchTheme(){
    document.styleSheets[1].disabled = !document.styleSheets[1].disabled;
    this.darkTheme = !this.darkTheme;
    localStorage.setItem('darkTheme', ''+this.darkTheme);
  }
}
