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

  async joinCommunity(community:Community){
    if(this.ndkProviderService.isTryingZapddit){
      let joinedCommunities = this.ndkProviderService.appData.followedCommunities;
      if(joinedCommunities === ""){
        this.ndkProviderService.appData.followedCommunities = community.id!
      } else {
        var communities = [...joinedCommunities.split(",")]
        communities.push(community.id!)
        this.ndkProviderService.appData.followedCommunities = communities.join(',');
      }
      this.ndkProviderService.followedCommunitiesEmitter.emit(this.ndkProviderService.appData.followedCommunities)
      return;
    }
    var joinedCommunities = await this.fetchJoinedCommunitiesMetadata() || [];
    joinedCommunities.push(community);
    await this.publishJoiningEvent(joinedCommunities);
  }

  async publishJoiningEvent(data:Community[]){
    var followedCommunities = [...new Set(data)];
    await this.publishCommunityListEvent(followedCommunities);
    var followedCommunitiesCsv = followedCommunities.map(i=>i.id!).join(',');
    localStorage.setItem(Constants.FOLLOWEDCOMMUNITIES,followedCommunitiesCsv);
    this.ndkProviderService.appData.followedCommunities = followedCommunitiesCsv;
    this.ndkProviderService.followedCommunitiesEmitter.emit(followedCommunitiesCsv);
  }

  async leaveCommunity(community:Community){
    if(this.ndkProviderService.isTryingZapddit){
      let joinedCommunities = this.ndkProviderService.appData.followedCommunities;
      if(joinedCommunities === ""){
        return;
      } else {
        var communities = [...joinedCommunities.split(",")]
        communities = communities.filter((c) => c !== community.id)
        this.ndkProviderService.appData.followedCommunities = communities.join(',');
        this.ndkProviderService.followedCommunitiesEmitter.emit(this.ndkProviderService.appData.followedCommunities)
      }
      return;
    }
    var existing = (await this.fetchJoinedCommunitiesMetadata() || []).filter(item=>item.id !== community.id!);
    await this.publishJoiningEvent(existing);
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
    var communitiesArr;
    if(this.ndkProviderService.isTryingZapddit){
      communitiesArr = this.ndkProviderService.appData.followedCommunities.split(",");
    } else {
      communitiesArr = (await this.ndkProviderService.fetchLatestDataFromInteroperableList()).communities;
    }
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

  buildCommunityListEvent(existing:Community[]): NDKEvent {
    const deDupedCommunities = this.deDuplicateCommunities(existing);

    var event = this.ndkProviderService.createNDKEvent();
    let tags: NDKTag[] = [];
    tags.push(['d', 'communities']);

    for(let item of deDupedCommunities){
      if(item.id && !(item.creatorHexKey!) && !(item.name!))
        tags.push(['a',`${item.id}`])
      else
        tags.push(['a',`34550:${item.creatorHexKey}:${item.name!}`])
    }

    event.tags = tags;
    event.kind = 30001;
    return event;
  }

  async publishCommunityListEvent(existing:Community[]){
    var event = this.buildCommunityListEvent(existing);
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

  deDuplicateCommunities(communities:Community[]){
    return communities.reduce((accumulator:Community[], current:Community) => {
      if (!accumulator.find((item) => item.id === current.id)) {
        accumulator.push(current);
      }
      return accumulator;
    }, []);
  }

}
