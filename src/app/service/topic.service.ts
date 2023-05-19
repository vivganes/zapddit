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

  muteTopic(topic:string){
    let mutedTopics:string = this.ndkProviderService.appData.mutedTopics;
    if (this.ndkProviderService.appData.mutedTopics === '') {
      mutedTopics = topic.toLowerCase();
    } else {
      //parse current followedTopics as array
      let mutedTopicsArr: string[] = this.ndkProviderService.appData.mutedTopics.split(',');
      mutedTopicsArr = mutedTopicsArr.concat(topic);
      mutedTopicsArr = [...new Set(mutedTopicsArr)]; //remove dupes

      mutedTopics = mutedTopicsArr.join(',');
    }
    this.ndkProviderService.publishAppData(undefined, undefined,mutedTopics);
  }


  unmuteTopic(topic: string) { 
    let mutedTopics:string = this.ndkProviderService.appData.mutedTopics;   
    if (this.ndkProviderService.appData.mutedTopics.split(',').length === 1) {
      mutedTopics = '';
    } else {
      //parse current followedTopics as array
      let mutedTopicsArr: string[] = this.ndkProviderService.appData.mutedTopics.split(',');
      mutedTopicsArr = mutedTopicsArr.filter(item => item !== topic);
      mutedTopicsArr = [...new Set(mutedTopicsArr)]; //remove dupes
      mutedTopics = mutedTopicsArr.join(',');
    }
    this.ndkProviderService.publishAppData(undefined, undefined,mutedTopics);
  }
}
