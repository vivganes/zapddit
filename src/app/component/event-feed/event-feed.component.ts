import { Constants } from 'src/app/util/Constants';
import { Component, EventEmitter, Input, Output, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import { TopicService } from 'src/app/service/topic.service';
import { HashTagFilter } from 'src/app/filter/HashTagFilter';
import { Subscription } from 'rxjs';
import { EventBuffer } from 'src/app/buffer/EventBuffer';
import { ReverseChrono } from 'src/app/sortlogic/ReverseChrono';

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

  @Input()
  tag: string | undefined;

  @Output()
  followChanged: EventEmitter<string> = new EventEmitter<string>();

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
      if(this.tag===undefined){
        this.nowShowingUptoIndex = 0;
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

  constructor(ndkProvider: NdkproviderService, private topicService: TopicService,
    private route: ActivatedRoute) {
    this.ndkProvider = ndkProvider;

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
      if(topic){
      this.tag = topic.toLowerCase();
      } else {
        this.tag = undefined;
      }
      this.until = Date.now();
      this.limit = BUFFER_REFILL_PAGE_SIZE;
      this.getEventsAndFillBuffer();
    });
  }

  async getEventsAndFillBuffer() {
    this.loadingEvents = true;
    this.loadingNextEvents = false;
    this.reachedEndOfFeed = false;
    if (this.tag && this.tag !== '') {
      const fetchedEvents = await this.ndkProvider.fetchEvents(this.tag || '', this.limit, undefined, this.until);
      if(fetchedEvents){
        const sorted = [... fetchedEvents].sort(new ReverseChrono().compare)
        this.eventBuffer.refillWithEntries(sorted);
        const eventsToAddToDisplay = this.eventBuffer.getItemsWithIndexes(this.nowShowingUptoIndex,BUFFER_READ_PAGE_SIZE-1);
        if(eventsToAddToDisplay){
          this.removeMutedAndSetEvents(new Set<NDKEvent>(eventsToAddToDisplay));
          this.nowShowingUptoIndex += BUFFER_READ_PAGE_SIZE;
        }
      }
      this.loadingEvents = false;
    } else {
      if(this.ndkProvider.appData.followedTopics.length > 0){
        const fetchedEvents = await this.ndkProvider.fetchAllFollowedEvents(
          this.ndkProvider.appData.followedTopics.split(','),
          this.limit,
          undefined,
          this.until
        );
        if(fetchedEvents){
          const sorted = [... fetchedEvents].sort(new ReverseChrono().compare)
          this.eventBuffer.refillWithEntries(sorted);
          const eventsToAddToDisplay = this.eventBuffer.getItemsWithIndexes(this.nowShowingUptoIndex,BUFFER_READ_PAGE_SIZE-1);
          if(eventsToAddToDisplay){
            this.removeMutedAndSetEvents(new Set<NDKEvent>(eventsToAddToDisplay));
            this.nowShowingUptoIndex += BUFFER_READ_PAGE_SIZE;
          }
        }
      }
      this.loadingEvents=false;
    }
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
      this.nowShowingUptoIndex += BUFFER_READ_PAGE_SIZE;

      if(this.nextEvents && this.nextEvents.size>0){
        if(this.events){
          let mutedTopicsArr:string[] = []
          if(this.ndkProvider.appData.mutedTopics && this.ndkProvider.appData.mutedTopics !== ''){
            mutedTopicsArr = this.ndkProvider.appData.mutedTopics.split(',')
          }
          [...this.nextEvents].filter(HashTagFilter.notHashTags(mutedTopicsArr)).forEach(this.events.add,this.events)
          this.loadingNextEvents = false;
          this.nextEvents =undefined;
        }
      } else {
        this.reachedEndOfFeed = true
      }
    } else {
      if(this.followedTopics && this.followedTopics.length > 0){
        this.nextEvents = new Set<NDKEvent>(this.eventBuffer.getItemsWithIndexes(this.nowShowingUptoIndex,this.nowShowingUptoIndex+BUFFER_READ_PAGE_SIZE-1))
      if(this.nextEvents.size === 0){
        const nextBatch = await this.ndkProvider.fetchAllFollowedEvents(
          this.ndkProvider.appData.followedTopics.split(','),
          this.limit,
          undefined,
          this.until
        );
        if(nextBatch){
          const sorted = [... nextBatch].sort(new ReverseChrono().compare)
          this.eventBuffer.refillWithEntries(sorted);
          this.nextEvents = new Set<NDKEvent>(this.eventBuffer.getItemsWithIndexes(this.nowShowingUptoIndex,BUFFER_READ_PAGE_SIZE-1))
        } 
      }
      this.nowShowingUptoIndex += BUFFER_READ_PAGE_SIZE;
      }
      if(this.nextEvents && this.nextEvents.size>0){
        if(this.events){
          let mutedTopicsArr:string[] = []
          if(this.ndkProvider.appData.mutedTopics && this.ndkProvider.appData.mutedTopics !== ''){
            mutedTopicsArr = this.ndkProvider.appData.mutedTopics.split(',')
          }
          [...this.nextEvents].filter(HashTagFilter.notHashTags(mutedTopicsArr)).forEach(this.events.add,this.events)
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

  followTopic(topic: string | undefined) {
    if (topic) {
      this.topicService.followTopic(topic);
    }
  }

  unfollowTopic(topic: string | undefined) {
    if (topic) {
      this.topicService.unfollowTopic(topic);
    }
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

  ngOnDestroy(): void {
    this.fetchingPeopleIFollowFromRelaySub.unsubscribe();
  }
}
