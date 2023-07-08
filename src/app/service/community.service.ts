import { Injectable } from '@angular/core';
import { NdkproviderService } from './ndkprovider.service';
import { Community } from '../model/community';
import { Constants } from '../util/Constants';
import { NDKEvent, NDKFilter, NDKTag } from '@nostr-dev-kit/ndk';

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
    const filter: NDKFilter = { kinds: [30001], '#d': ["communities"], authors:[this.ndkProviderService.currentUser?.hexpubkey()!] };
    const events = await this.ndkProviderService.ndk?.fetchEvents(filter,{});

    if(events && events.size > 0){
      const communityEvent = events.values().next().value
      const name = communityEvent.getMatchingTags('d')[0][1];

      if(name && name === "communities"){
        const joinedCommunitiesTagArr:NDKTag[] = communityEvent.getMatchingTags('a');
        let communities:Community[] = []
        for(let tag of joinedCommunitiesTagArr) {
          if(tag[1]){
            communities.push((await this.ndkProviderService.getCommunityDetails(tag[1]))!);
          }
        };

        return communities;
      }
    }
    return [];
  }

  async fetchJoinedCommunitiesMetadata():Promise<Community[]>{
    const filter: NDKFilter = { kinds: [30001], '#d': ["communities"], authors:[this.ndkProviderService.currentUser?.hexpubkey()!] };
    const events = await this.ndkProviderService.ndk?.fetchEvents(filter,{});

    if(events && events.size > 0){
      const communityEvent = events.values().next().value
      const name = communityEvent.getMatchingTags('d')[0][1];

      if(name && name === "communities"){
        const joinedCommunitiesTagArr:NDKTag[] = communityEvent.getMatchingTags('a');
        let communities:Community[] = []
        for(let tag of joinedCommunitiesTagArr) {
          if(tag[1]){
            communities.push({id: tag[1]});
          }
        };

        return communities;
      }
    }
    return [];
  }
}
