import { Injectable } from '@angular/core';
import { NdkproviderService } from './ndkprovider.service';
import { Community } from '../model/community';
import { Constants } from '../util/Constants';

@Injectable({
  providedIn: 'root'
})
export class CommunityService {

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
}
