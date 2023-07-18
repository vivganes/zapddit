import { Injectable } from '@angular/core';
import { NdkproviderService } from './ndkprovider.service';
import { Constants } from '../util/Constants';
import { NDKEvent,  NDKTag } from '@nostr-dev-kit/ndk';

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
    localStorage.setItem(Constants.FOLLOWEDTOPICS,followedTopics);
    this.ndkProviderService.publishAppData(followedTopics);
  }

  async followTopicInteroperableList(topic:string){
    var existing = await this.fetchFollowedTopics() || [];
    existing.push(topic);
    await this.follow(existing);
  }

  async followTopicsInteroperableList(topic:string[]){
    var existing = await this.fetchFollowedTopics() || [];
    existing.push(...topic);
    await this.follow(existing);
  }

  async follow(data:string[]){
    var existing = [...new Set(data)];
    await this.buildAndPublish(existing);
    var followedTopics = existing.join(',');
    localStorage.setItem(Constants.FOLLOWEDTOPICS,followedTopics);
    this.ndkProviderService.appData.followedTopics = followedTopics;
    this.ndkProviderService.followedTopicsEmitter.emit(followedTopics);
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
    localStorage.setItem(Constants.FOLLOWEDTOPICS,followedTopics);
    this.ndkProviderService.publishAppData(followedTopics);
  }

  async unfollowTopicInteroperableList(topic: string) {
    var existing = (await this.fetchFollowedTopics() || []).filter(i=>i!==topic);
    await this.follow(existing);
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
    localStorage.setItem(Constants.MUTEDTOPICS,mutedTopics);
    this.ndkProviderService.publishAppData(undefined, undefined,mutedTopics);
  }

  async muteTopicInteroperableList(topic:string){
    var existing = await this.fetchMutedTopics() || [];
    existing.push(topic);
    await this.mute(existing);
  }

  async muteTopicsInteroperableList(topic:string[]){
    var existing = await this.fetchMutedTopics() || [];
    existing.push(...topic);
    await this.mute(existing);
  }

  async mute(data:string[]){
    var existing = [...new Set(data)];
    await this.buildAndPublish(existing, true);
    var mutedTopics = existing.join(',');
    localStorage.setItem(Constants.MUTEDTOPICS,mutedTopics);
    this.ndkProviderService.appData.mutedTopics = mutedTopics;
    this.ndkProviderService.mutedTopicsEmitter.emit(mutedTopics);
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
    localStorage.setItem(Constants.MUTEDTOPICS,mutedTopics);
    this.ndkProviderService.publishAppData(undefined, undefined,mutedTopics);
  }

  async unmuteTopicInteroperableList(topic: string) {
    var existing = (await this.fetchMutedTopics() || []).filter(item=> item !== topic);
    await this.mute(existing);
  }

  async fetchFollowedTopics():Promise<string[]>{
    var fromStandardSource = (await this.ndkProviderService.fetchLatestDataFromInteroperableList()).hashtags;

    var fromAppSource =  this.ndkProviderService.appData.followedTopics.split(',');

    return [...new Set(fromStandardSource.concat(fromAppSource))];
  }

  async fetchMutedTopics():Promise<string[]>{
    return this.ndkProviderService.appData.mutedTopics.split(',');
  }

  buildEvent(existing:string[], muted:boolean = false): NDKEvent {
    var event = this.ndkProviderService.createNDKEvent();
    let tags: NDKTag[] = [];
    if(muted)
      tags.push(['d', 'mutehashtags']);
    else
      tags.push(['d', 'hashtags']);

    for(let item of existing){
      if(item)
        tags.push(['t',`${item}`])
    }

    event.tags = tags;
    event.kind = 30001;
    return event;
  }

  async buildAndPublish(existing:string[], mute:boolean = false){
    var event = this.buildEvent(existing, mute);
    await event.sign();
    await event.publish();
  }
}
