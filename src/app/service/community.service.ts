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
      tags.push(['p', newCommunity.creatorHexKey!,'',this.MODERATOR]);

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
}
