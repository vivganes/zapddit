import { Component, ComponentRef } from '@angular/core'
import '@cds/core/icon/register.js';
import { ClarityIcons, userIcon, boltIcon, childArrowIcon, plusCircleIcon, logoutIcon } from '@cds/core/icon';
import { NdkproviderService } from './service/ndkprovider.service';
import { TopicService } from './service/topic.service';
import { EventFeedComponent } from './component/event-feed/event-feed.component';
import { Router } from '@angular/router';
import { NDKUserProfile } from '@nostr-dev-kit/ndk';

ClarityIcons.addIcons(userIcon, boltIcon, childArrowIcon, plusCircleIcon, logoutIcon);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'zappedit'
  private topicService:TopicService;
  private router:Router;
  followedTopics:string[] = [];

  private ndkProvider: NdkproviderService;

  constructor(ndkProvider: NdkproviderService, topicService:TopicService, router:Router){
    this.ndkProvider = ndkProvider;
    this.topicService = topicService;    
    this.router= router;
  }

  ngOnInit(){
    if(this.topicService.followedTopics === ''){
      this.followedTopics = []
    } else {
      this.followedTopics = this.topicService.followedTopics.split(",");
    }
  }

  subscribeToEmitter(componentRef: ComponentRef<any>){
    if(!(componentRef instanceof EventFeedComponent)){
      return;
    }

    const eventFeedComponent: EventFeedComponent = componentRef
    eventFeedComponent.followChanged.subscribe(() => {
      if(this.topicService.followedTopics === ''){
        this.followedTopics = []
      } else {
        this.followedTopics = this.topicService.followedTopics.split(",");
      }
    })
  }

  isTopicFollowed(topic:string):boolean{
    if(this.followedTopics.indexOf(topic)>-1){
      return true;
    }
    return false;
  } 

  isLoggedIn (): boolean {
    return this.ndkProvider.isLoggedIn()
  }

  getCurrentUserProfile(): NDKUserProfile|undefined{
    return this.ndkProvider.getCurrentUserProfile();
  }

  search(){
    let topic =  (<HTMLInputElement>document.getElementById("search-input-sidenav-ng")).value;
    this.router.navigate(['t',{topic}])
  }

  
  





  
}
