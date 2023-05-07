import { Component } from '@angular/core'
import '@cds/core/icon/register.js';
import { ClarityIcons, userIcon, boltIcon, childArrowIcon, plusCircleIcon, logoutIcon } from '@cds/core/icon';
import { NdkproviderService } from './service/ndkprovider.service';
import { TopicService } from './service/topic.service';

ClarityIcons.addIcons(userIcon, boltIcon, childArrowIcon, plusCircleIcon, logoutIcon);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'zappedit'
  currentlyShowingTag: string = window.location.href.split("/").at(-1) || 'foodstr'
  private topicService:TopicService;
  followedTopics:string[] = [];

  private ndkProvider: NdkproviderService;

  constructor(ndkProvider: NdkproviderService, topicService:TopicService){
    this.ndkProvider = ndkProvider;
    this.topicService = topicService;
  }

  ngOnInit(){
    if(this.topicService.followedTopics === ''){
      this.followedTopics = [];
    } else {
      this.followedTopics = this.topicService.followedTopics.split(',');
    }
  }
  
  isLoggedIn (): boolean {
    return this.ndkProvider.isLoggedIn()
  }

  search(){
    let tag =  (<HTMLInputElement>document.getElementById("search-input-sidenav-ng")).value;
    window.location.href = '/t/'+tag;
  }

  followTopic(topic:string){
    this.topicService.followTopic(topic);
    this.followedTopics = this.topicService.followedTopics.split(',');
  }

  unfollowTopic(topic:string){
    this.topicService.unfollowTopic(topic);
    if(this.topicService.followedTopics.length===0){
      this.followedTopics=[]
    } else {
    this.followedTopics = this.topicService.followedTopics.split(',');
    }
  }

  isTopicFollowed(topic:string):boolean{
    if(this.followedTopics.indexOf(topic)>-1){
      return true;
    }
    return false;
  }
  





  
}
