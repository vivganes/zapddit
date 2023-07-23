import { Constants } from 'src/app/util/Constants';
import { Component, EventEmitter, Input, Output, SimpleChanges, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import { TopicService } from 'src/app/service/topic.service';
import { HashTagFilter } from 'src/app/filter/HashTagFilter';
import { Subscription } from 'rxjs';
import { EventBuffer } from 'src/app/buffer/EventBuffer';
import { ReverseChrono } from 'src/app/sortlogic/ReverseChrono';
import { Community } from 'src/app/model/community';
import { FeedType } from 'src/app/enum/FeedType';

const BUFFER_REFILL_PAGE_SIZE = 100;
const BUFFER_READ_PAGE_SIZE = 20;
 @Component({
  selector: 'app-event-feed',
  templateUrl: './event-feed.component.html',
  styleUrls: ['./event-feed.component.scss'],
})
export class EventFeedComponent implements OnInit,OnDestroy{
  until: number | undefined = Date.now();
  limit: number | undefined = BUFFER_REFILL_PAGE_SIZE;
  loadingEvents: boolean = false;
  loadingNextEvents: boolean = false;
  reachedEndOfFeed : boolean = false;
  peopleIFollowLoadedFromRelay:boolean=false;
  fetchingPeopleIFollowFromRelaySub:Subscription=new Subscription();

  feedTypeOptions=[
    FeedType.TOPICS_FEED,
    FeedType.COMMUNITIES_FEED
  ]

  @Input()
  tag: string | undefined;

  @Input()
  community?: Community;
  loadingCommunityDetails:boolean = false;
  showUnapprovedPosts:boolean = false;
  followedCommunities?: string[]
  feedType:FeedType = FeedType.TOPICS_FEED;
  showingCommunityInfo:boolean = false;

  followedTopics: string[]|undefined;
  events: Set<NDKEvent> | undefined;
  nextEvents: Set<NDKEvent> | undefined;
  isLoggedInUsingPubKey:boolean = false;
  eventBuffer: EventBuffer<NDKEvent> = new EventBuffer<NDKEvent>();
  nowShowingUptoIndex:number = 0;

  ndkProvider: NdkproviderService;

  ngOnInit():void {
    this.ndkProvider.followedTopicsEmitter.subscribe((followedTopics: string) => {
      if (followedTopics === '') {
        this.followedTopics = [];
      } else {
        this.followedTopics = followedTopics.split(',');
      }
      if(this.feedType == FeedType.TOPICS_FEED && this.tag===undefined){
        this.nowShowingUptoIndex = 0;
        this.eventBuffer.events = [];
        this.until = Date.now();
        this.limit = BUFFER_REFILL_PAGE_SIZE;
        this.getEventsAndFillBuffer();
      }
    });

    this.ndkProvider.followedCommunitiesEmitter.subscribe((followedCommunities: string) => {
      if (followedCommunities === '') {
        this.followedCommunities = [];
      } else {
        this.followedCommunities = followedCommunities.split(',');
      }
      if(this.feedType == FeedType.COMMUNITIES_FEED && this.followedCommunities===undefined){
        this.nowShowingUptoIndex = 0;
        this.events = undefined;
        this.eventBuffer.events = [];
        this.until = Date.now();
        this.limit = BUFFER_REFILL_PAGE_SIZE;
        this.getEventsAndFillBuffer();
      }
    });

    this.ndkProvider.isLoggedInUsingPubKey$.subscribe(val => {
      this.isLoggedInUsingPubKey = val;
    });

    this.fetchingPeopleIFollowFromRelaySub = this.ndkProvider.fetchingPeopleIFollowFromRelay$.subscribe(val=>{
      if(val===false && localStorage.getItem(Constants.FOLLOWERS_FROM_RELAY)==='false'){
        this.peopleIFollowLoadedFromRelay = true;
      }
    })
  }

  onChangeFeedType(newType: FeedType){
        this.nowShowingUptoIndex = 0;
        this.events = undefined;
        this.eventBuffer.events = [];
        this.until = Date.now();
        this.limit = BUFFER_REFILL_PAGE_SIZE;
        this.getEventsAndFillBuffer();
  }

  constructor(ndkProvider: NdkproviderService, private topicService: TopicService,
    private route: ActivatedRoute, private router:Router) {
    this.ndkProvider = ndkProvider;
    var showUnapprovedPostsFromLocal = localStorage.getItem(Constants.SHOW_UNAPPROVED);
    if (showUnapprovedPostsFromLocal && showUnapprovedPostsFromLocal === 'true') {
      this.showUnapprovedPosts = true;
    }

    var defaultFeedIsCommunity = localStorage.getItem(Constants.DEFAULT_FEED_IS_COMMUNITY);
    if (defaultFeedIsCommunity && defaultFeedIsCommunity === 'true') {
      this.feedType = FeedType.COMMUNITIES_FEED;
    }

    const followedTopicsByNdk = ndkProvider.appData.followedTopics;
    if (followedTopicsByNdk === '') {
      this.followedTopics = [];
    } else {
      this.followedTopics = followedTopicsByNdk.split(',');
    }

    route.params.subscribe(params => {
      this.nowShowingUptoIndex = 0;
      this.eventBuffer.events = [];
      let topic = params['topic'];
      let communityName = params['communityName'];
      let communityCreatorHexKey = params['creatorHexKey'];
      if(topic){
      this.tag = topic.toLowerCase();
      } else if(communityName){
        this.loadingCommunityDetails = true;
        const self = this;
        this.ndkProvider.getCommunityDetails(`34550:${communityCreatorHexKey}:${communityName}`).then((community)=>{
          self.community = community;
          self.populateCommunityAuthorProfile();
          self.loadingCommunityDetails = false;
          self.until = Date.now();
          self.limit = BUFFER_REFILL_PAGE_SIZE;
          self.getEventsAndFillBuffer();
        })
      }
      else {
        this.tag = undefined;
      }
      if(!communityName){ // global feed
        this.until = Date.now();
        this.limit = BUFFER_REFILL_PAGE_SIZE;
        this.getEventsAndFillBuffer();
      }
    });
  }

  async populateCommunityAuthorProfile(){
    if(this.community && !this.community.creatorProfile){
      const creator = await this.ndkProvider.getProfileFromHex(this.community.creatorHexKey!)
      this.community.creatorProfile = creator;
    }
  }

  public get FeedType(){
    return FeedType;
  }


  async getEventsAndFillBuffer() {
    this.loadingEvents = true;
    this.loadingNextEvents = false;
    this.reachedEndOfFeed = false;
    let fetchedEvents;
    if (this.tag && this.tag !== '') {
      fetchedEvents = await this.ndkProvider.fetchEvents(this.tag || '', this.limit, undefined, this.until);
    } else if (this.community){
      fetchedEvents = await this.ndkProvider.fetchEventsFromCommunity(this.community || '', this.limit, undefined, this.until);
    } else {
      if(this.feedType === FeedType.TOPICS_FEED){
        if(this.ndkProvider.appData.followedTopics.length > 0){
          fetchedEvents = await this.ndkProvider.fetchAllFollowedTopicEvents(
            this.ndkProvider.appData.followedTopics.split(','),
            this.limit,
            undefined,
            this.until
          );
        }
      } else if (this.feedType === FeedType.COMMUNITIES_FEED){
        if(this.ndkProvider.appData.followedCommunities.length > 0){
          fetchedEvents = await this.ndkProvider.fetchAllFollowedCommunityEvents(
            this.ndkProvider.appData.followedCommunities.split(','),
            this.limit,
            undefined,
            this.until
          );
        }
      }
    }
    if(fetchedEvents){
      const sorted = [... fetchedEvents].sort(new ReverseChrono().compare)
      this.eventBuffer.refillWithEntries(sorted);
      const eventsToAddToDisplay = this.eventBuffer.getItemsWithIndexes(this.nowShowingUptoIndex,BUFFER_READ_PAGE_SIZE-1);
      if(eventsToAddToDisplay){
        this.removeMutedAndSetEvents(new Set<NDKEvent>(eventsToAddToDisplay));
        this.nowShowingUptoIndex += (fetchedEvents.size>BUFFER_READ_PAGE_SIZE)?BUFFER_READ_PAGE_SIZE:fetchedEvents.size;
      } else {
        this.events = new Set();
      }
    } else {
      this.events = new Set();
    }
    this.loadingEvents=false;
  }

  private removeMutedAndSetEvents(fetchedEvents: Set<NDKEvent>) {
    let mutedTopicsArr: string[] = [];
    if (this.ndkProvider.appData.mutedTopics && this.ndkProvider.appData.mutedTopics !== '') {
          mutedTopicsArr = this.ndkProvider.appData.mutedTopics.split(',');
    }
    this.events = new Set([...fetchedEvents].filter(HashTagFilter.notHashTags(mutedTopicsArr)));
  }

  addEventToFeed(postedEvent: NDKEvent){
    if(this.events){
      this.removeMutedAndSetEvents(new Set([postedEvent].concat(...this.events)));
    } else {
      this.removeMutedAndSetEvents(new Set([postedEvent]));
    }
  }

  async getEventsForNextPage() {
    this.loadingNextEvents = true;
    this.reachedEndOfFeed = false;
    if (this.tag && this.tag !== '') {
      this.nextEvents = new Set<NDKEvent>(this.eventBuffer.getItemsWithIndexes(this.nowShowingUptoIndex,this.nowShowingUptoIndex+BUFFER_READ_PAGE_SIZE-1))
      if(this.nextEvents.size === 0){
        this.until = this.getOldestEventTimestamp();
        const nextBatch = await this.ndkProvider.fetchEvents(this.tag || '', this.limit, undefined, this.until);
        if(nextBatch){
          const sorted = [... nextBatch].sort(new ReverseChrono().compare)
          this.eventBuffer.refillWithEntries(sorted);
          this.nextEvents = new Set<NDKEvent>(this.eventBuffer.getItemsWithIndexes(this.nowShowingUptoIndex,BUFFER_READ_PAGE_SIZE-1))
        }
      }

      if(this.nextEvents && this.nextEvents.size>0){
        if(this.events){
          let mutedTopicsArr:string[] = []
          if(this.ndkProvider.appData.mutedTopics && this.ndkProvider.appData.mutedTopics !== ''){
            mutedTopicsArr = this.ndkProvider.appData.mutedTopics.split(',')
          }
          [...this.nextEvents].filter(HashTagFilter.notHashTags(mutedTopicsArr)).forEach(this.events.add,this.events)
          this.nowShowingUptoIndex += (this.nextEvents.size>BUFFER_READ_PAGE_SIZE)?BUFFER_READ_PAGE_SIZE:this.nextEvents.size;
          this.loadingNextEvents = false;
          this.nextEvents =undefined;
        }
      } else {
        this.reachedEndOfFeed = true
      }
    } else if (this.community){
      this.nextEvents = new Set<NDKEvent>(this.eventBuffer.getItemsWithIndexes(this.nowShowingUptoIndex,this.nowShowingUptoIndex+BUFFER_READ_PAGE_SIZE-1))
      if(this.nextEvents.size === 0){
        this.until = this.getOldestEventTimestamp();
        const nextBatch = await this.ndkProvider.fetchEventsFromCommunity(this.community, this.limit, undefined, this.until);
        if(nextBatch){
          const sorted = [... nextBatch].sort(new ReverseChrono().compare)
          this.eventBuffer.refillWithEntries(sorted);
          this.nextEvents = new Set<NDKEvent>(this.eventBuffer.getItemsWithIndexes(this.nowShowingUptoIndex,BUFFER_READ_PAGE_SIZE-1))
        }
      }

      if(this.nextEvents && this.nextEvents.size>0){
        if(this.events){
          let mutedTopicsArr:string[] = []
          if(this.ndkProvider.appData.mutedTopics && this.ndkProvider.appData.mutedTopics !== ''){
            mutedTopicsArr = this.ndkProvider.appData.mutedTopics.split(',')
          }
          [...this.nextEvents].filter(HashTagFilter.notHashTags(mutedTopicsArr)).forEach(this.events.add,this.events)
          this.nowShowingUptoIndex += (this.nextEvents.size>BUFFER_READ_PAGE_SIZE)?BUFFER_READ_PAGE_SIZE:this.nextEvents.size;
          this.loadingNextEvents = false;
          this.nextEvents =undefined;
        }
      } else {
        this.reachedEndOfFeed = true
      }
    } else { //HOME FEED
      this.nextEvents = new Set<NDKEvent>(this.eventBuffer.getItemsWithIndexes(this.nowShowingUptoIndex,this.nowShowingUptoIndex+BUFFER_READ_PAGE_SIZE-1))
      if(this.nextEvents.size === 0){
        let nextBatch;
        if(this.feedType == FeedType.TOPICS_FEED){
          nextBatch = await this.ndkProvider.fetchAllFollowedTopicEvents(
            this.ndkProvider.appData.followedTopics.split(','),
            this.limit,
            undefined,
            this.until
          );
        } else if(this.feedType === FeedType.COMMUNITIES_FEED){
          nextBatch = await this.ndkProvider.fetchAllFollowedCommunityEvents(
            this.ndkProvider.appData.followedCommunities.split(','),
            this.limit,
            undefined,
            this.until
          );
        }
        if(nextBatch){
          const sorted = [... nextBatch].sort(new ReverseChrono().compare)
          this.eventBuffer.refillWithEntries(sorted);
          this.nextEvents = new Set<NDKEvent>(this.eventBuffer.getItemsWithIndexes(this.nowShowingUptoIndex,BUFFER_READ_PAGE_SIZE-1))
        }
      }
      if(this.nextEvents && this.nextEvents.size>0){
        if(this.events){
          let mutedTopicsArr:string[] = []
          if(this.ndkProvider.appData.mutedTopics && this.ndkProvider.appData.mutedTopics !== ''){
            mutedTopicsArr = this.ndkProvider.appData.mutedTopics.split(',')
          }
          [...this.nextEvents].filter(HashTagFilter.notHashTags(mutedTopicsArr)).forEach(this.events.add,this.events)
          this.nowShowingUptoIndex += (this.nextEvents.size>BUFFER_READ_PAGE_SIZE)?BUFFER_READ_PAGE_SIZE:this.nextEvents.size;
          this.loadingNextEvents = false;
          this.nextEvents =undefined;
        }
      } else {
        this.reachedEndOfFeed = true
      }
    }
  }

  getOldestEventTimestamp(): number | undefined {
    if (this.events) {
      // let timestampsOfEvents: (number | undefined)[] = Array.from(this.events).map(ndkEvent => {
      //   return ndkEvent.created_at;
      // });
      // return Math.min(...(timestampsOfEvents as number[]));

      return this.eventBuffer!.events![this.eventBuffer!.events!.length-1].created_at!;
    }
    return Date.now();
  }

  isLoggedIn(): boolean {
    return this.ndkProvider.isLoggedIn();
  }

  async followTopic(topic: string | undefined) {
    if (topic) {
        this.topicService.followTopicInteroperableList(topic);
    }

    await this.topicService.clearTopicsFromAppData();
  }

  async unfollowTopic(topic: string | undefined) {
    if (topic) {
        this.topicService.unfollowTopicInteroperableList(topic);
    }
    await this.topicService.clearTopicsFromAppData();
  }

  isTopicFollowed(topic: string | undefined): boolean {
    if (topic) {
      if (this.followedTopics && this.followedTopics.indexOf(topic) > -1) {
        return true;
      }
    }
    return false;
  }

  loadMoreEvents(){
    this.getEventsForNextPage();
  }

  openCommunityPage(){
    if(this.community)
      this.router.navigateByUrl('n/'+this.community.name+'/'+this.community.creatorHexKey)
  }

  openCommunityCreatorInSnort(){
    if(this.community)
      window.open('https://snort.social/e/'+this.community.creatorHexKey!,'_blank')
  }

  ngOnDestroy(): void {
    this.fetchingPeopleIFollowFromRelaySub.unsubscribe();
  }

  searchFromMobile(){
    let topic = (<HTMLInputElement>document.getElementById('search_input_mobile')).value;
    if(topic && topic !==''){
      topic = topic.toLowerCase();
      if(topic.startsWith('#')){
        topic = topic.slice(1);
      }
      this.router.navigate(['t', { topic }]);
    }
  }
}
