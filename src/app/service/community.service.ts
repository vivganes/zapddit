import { Injectable } from '@angular/core';
import { NdkproviderService } from './ndkprovider.service';
import { Community } from '../model/community';
import { Constants } from '../util/Constants';
import { NDKEvent, NDKTag } from '@nostr-dev-kit/ndk';

@Injectable({
  providedIn: 'root'
})
export class CommunityService {

  readonly MODERATOR:string='moderator';

  constructor(private ndkProviderService: NdkproviderService) { }

  joinCommunity(community:Community){
    let followedCommunities:string = this.ndkProviderService.appData.followedCommunities;
    if (this.ndkProviderService.appData.followedCommunities === '') {
      followedCommunities = community.id!;
    } else {
      //parse current followedTopics as array
      let followedArr: string[] = this.ndkProviderService.appData.followedCommunities.split(',');
      followedArr = followedArr.concat(community.id!);
      followedArr = [...new Set(followedArr)]; //remove dupes

      followedCommunities = followedArr.join(',');
    }
    localStorage.setItem(Constants.FOLLOWEDCOMMUNITIES,followedCommunities);
    this.ndkProviderService.publishAppData(undefined, undefined, undefined, followedCommunities);
  }

  async joinCommunityInteroperableList(community:Community){
    var existing = await this.fetchJoinedCommunitiesMetadata() || [];
    existing.push(community);
    await this.join(existing);
  }

  async join(data:Community[]){
    var existing = [...new Set(data)];
    await this.buildAndPublish(existing);
    var followedCommunities = existing.map(i=>i.id!).join(',');
    localStorage.setItem(Constants.FOLLOWEDCOMMUNITIES,followedCommunities);
    this.ndkProviderService.appData.followedCommunities = followedCommunities;
    this.ndkProviderService.followedCommunitiesEmitter.emit(followedCommunities);
  }

  async joinCommunitiesInteroperableList(communities:Community[]){
    var existing = await this.fetchJoinedCommunitiesMetadata() || [];
    existing.push(...communities);
    await this.join(existing);
  }

  leaveCommunity(community:Community){
    let followedCommunities:string = this.ndkProviderService.appData.followedCommunities;
    if (this.ndkProviderService.appData.followedCommunities.split(',').length === 1) {
      followedCommunities = '';
    } else {
      //parse current followedTopics as array
      let followedArr: string[] = this.ndkProviderService.appData.followedCommunities.split(',');
      followedArr = followedArr.filter(item => item !== community.id!);
      followedArr = [...new Set(followedArr)]; //remove dupes
      followedCommunities = followedArr.join(',');
    }
    localStorage.setItem(Constants.FOLLOWEDCOMMUNITIES,followedCommunities);
    this.ndkProviderService.publishAppData(undefined, undefined, undefined, followedCommunities);
  }

  async leaveCommunityInteroperableList(community:Community){
    var existing = (await this.fetchJoinedCommunitiesMetadata() || []).filter(item=>item.id !== community.id!);
    await this.join(existing);
  }

  async createCommunity(newCommunity:Community){
    if (this.ndkProviderService.canWriteToNostr) {
      const ndkEvent = this.ndkProviderService.createNDKEvent();
      let tags: NDKTag[] = [];
      tags.push(['d', newCommunity.name!]);

      if(newCommunity.displayName)
      tags.push(['name', newCommunity.displayName]);

      if(newCommunity.description)
        tags.push(['description', newCommunity.description])

      if(newCommunity.image){
        tags.push(['image', newCommunity.image])
      }

      if(newCommunity.rules)
        tags.push(['rules', newCommunity.rules])

      if(newCommunity.moderatorHexKeys && newCommunity.moderatorHexKeys.length>0){
        for(let mod of newCommunity.moderatorHexKeys)
          tags.push(['p', mod,'',this.MODERATOR])
      }

      ndkEvent.tags = tags;
      ndkEvent.kind = 34550;
      await ndkEvent.publish();
      }
  }

  async fetchJoinedCommunities():Promise<Community[]>{
    var communitiesArr = (await this.ndkProviderService.fetchLatestDataFromInteroperableList()).communities;
    var communitiesDetails:Community[] = [];

    for(let tag of communitiesArr) {
      if(tag){
        communitiesDetails.push((await this.ndkProviderService.getCommunityDetails(tag))!);
      }
    }

    return communitiesDetails;
  }

  async fetchJoinedCommunitiesMetadata():Promise<Community[]>{
    var communitiesArr = (await this.ndkProviderService.fetchLatestDataFromInteroperableList()).communities;

    var communities:Community[] = [];

    for(let c of communitiesArr){
      communities.push({id: c});
    }

    return communities;
  }

  buildEvent(existing:Community[]): NDKEvent {
    existing = this.ndkProviderService.deDuplicateCommunities(existing);

    var event = this.ndkProviderService.createNDKEvent();
    let tags: NDKTag[] = [];
    tags.push(['d', 'communities']);

    for(let item of existing){
      if(item.id && !(item.creatorHexKey!) && !(item.name!))
        tags.push(['a',`${item.id}`])
      else
        tags.push(['a',`34450:${item.creatorHexKey}:${item.name!}`])
    }

    event.tags = tags;
    event.kind = 30001;
    return event;
  }

  async buildAndPublish(existing:Community[]){
    var event = this.buildEvent(existing);
    await event.sign();
    await event.publish();
  }

  async clearCommunitiesFromAppData(){
    var communitiesCleared = localStorage.getItem(Constants.COMMUNITIES_CLEARED) || "false";
    var data = await this.ndkProviderService.fetchAppData();
    if(communitiesCleared === "false" || (data.communities.length>0 && data.communities[0]!=='')){
      this.ndkProviderService.publishAppData(data.hashtags.join(','), data.downzapRecipients,data.mutedHashtags,'');
      localStorage.setItem(Constants.COMMUNITIES_CLEARED, "true")
    }
  }

}
