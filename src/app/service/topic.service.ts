import { Injectable } from '@angular/core';
import { NdkproviderService } from './ndkprovider.service';
import { NDKEvent } from '@nostr-dev-kit/ndk';

@Injectable({
  providedIn: 'root',
})
export class TopicService {
  followedTopics: string = localStorage.getItem('followedTopics') || '';
  ndkProviderService: NdkproviderService;

  constructor(ndkProviderService: NdkproviderService) {
    this.ndkProviderService = ndkProviderService;
  }

  followTopic(topic: string) {
    if (this.followedTopics === '') {
      this.followedTopics = topic.toLowerCase();
    } else {
      //parse current followedTopics as array
      let followedTopicsArr: string[] = this.followedTopics.split(',');
      followedTopicsArr = followedTopicsArr.concat(topic);
      followedTopicsArr = [...new Set(followedTopicsArr)]; //remove dupes

      this.followedTopics = followedTopicsArr.join(',');
    }
    localStorage.setItem('followedTopics', this.followedTopics);
    this.ndkProviderService.publishAppData(this.followedTopics);
  }

  unfollowTopic(topic: string) {
    if (this.followedTopics.split(',').length === 1) {
      this.followedTopics = '';
    } else {
      //parse current followedTopics as array
      let followedTopicsArr: string[] = this.followedTopics.split(',');
      followedTopicsArr = followedTopicsArr.filter(item => item !== topic);
      followedTopicsArr = [...new Set(followedTopicsArr)]; //remove dupes
      this.followedTopics = followedTopicsArr.join(',');
    }
    localStorage.setItem('followedTopics', this.followedTopics);
    this.ndkProviderService.publishAppData(this.followedTopics);
  }
}
