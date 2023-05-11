import { Injectable } from '@angular/core';
import { NdkproviderService } from './ndkprovider.service';

@Injectable({
  providedIn: 'root',
})
export class TopicService {
  ndkProviderService: NdkproviderService;

  constructor(ndkProviderService: NdkproviderService) {
    this.ndkProviderService = ndkProviderService;
  }

  followTopic(topic: string) {
    let followedTopics:string = this.ndkProviderService.appData.followedTopics;
    if (this.ndkProviderService.appData.followedTopics === '') {
      followedTopics = topic.toLowerCase();
    } else {
      //parse current followedTopics as array
      let followedTopicsArr: string[] = this.ndkProviderService.appData.followedTopics.split(',');
      followedTopicsArr = followedTopicsArr.concat(topic);
      followedTopicsArr = [...new Set(followedTopicsArr)]; //remove dupes

      followedTopics = followedTopicsArr.join(',');
    }
    this.ndkProviderService.publishAppData(followedTopics);
  }

  unfollowTopic(topic: string) { 
    let followedTopics:string = this.ndkProviderService.appData.followedTopics;   
    if (this.ndkProviderService.appData.followedTopics.split(',').length === 1) {
      followedTopics = '';
    } else {
      //parse current followedTopics as array
      let followedTopicsArr: string[] = this.ndkProviderService.appData.followedTopics.split(',');
      followedTopicsArr = followedTopicsArr.filter(item => item !== topic);
      followedTopicsArr = [...new Set(followedTopicsArr)]; //remove dupes
      followedTopics = followedTopicsArr.join(',');
    }
    this.ndkProviderService.publishAppData(followedTopics);
  }
}
