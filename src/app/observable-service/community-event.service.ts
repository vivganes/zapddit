import { Injectable } from '@angular/core';
import { NdkproviderService } from '../service/ndkprovider.service';
import { NDKEvent, NDKSubscription } from '@nostr-dev-kit/ndk';
import { BehaviorSubject, Observable } from 'rxjs';
import {List} from 'immutable';

interface CommunityWithRecentActivityTime{
  communityId:string,
  recentActivityAt?:number
}

@Injectable({
  providedIn: 'root'
})
export class CommunityEventService {
  private _communityEvents: BehaviorSubject<List<CommunityWithRecentActivityTime>> = new BehaviorSubject<List<CommunityWithRecentActivityTime>>(List([]));
  public readonly communityEvents: Observable<List<CommunityWithRecentActivityTime>> = this._communityEvents.asObservable();


  constructor(private ndk:NdkproviderService) {
    this.startSubscription();
  }

  startSubscription() {
    const subscription: NDKSubscription =  this.ndk.createSubscriptionForCommunityEvents();
    subscription.addListener('event',(event: NDKEvent)=> {
      const communityId = event.getMatchingTags('a')[0][1];
      const activityAt = event.created_at;
      const packedObj:CommunityWithRecentActivityTime = {
        communityId: communityId,
        recentActivityAt: activityAt
      }
      let existingArray = this._communityEvents.getValue();
      existingArray = existingArray.filter((item)=> item.communityId !== communityId);
      existingArray = existingArray.push(packedObj);
      existingArray = existingArray.sortBy(item => -item.recentActivityAt!);
      this._communityEvents.next(existingArray.slice(0,10));
    });
  }

}

