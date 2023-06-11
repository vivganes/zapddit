import { Constants } from 'src/app/util/Constants';
import { Util } from 'src/app/util/Util';
import { Component, EventEmitter, Input, Output, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import { TopicService } from 'src/app/service/topic.service';
import { HashTagFilter } from 'src/app/filter/HashTagFilter';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-event-feed',
  templateUrl: './event-feed.component.html',
  styleUrls: ['./event-feed.component.scss'],
})
export class EventFeedComponent implements OnInit,OnDestroy{
  until: number | undefined = Date.now();
  limit: number | undefined = 15;
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

  ndkProvider: NdkproviderService;

  ngOnInit():void {
    this.ndkProvider.followedTopicsEmitter.subscribe((followedTopics: string) => {
      if (followedTopics === '') {
        this.followedTopics = [];
      } else {
        this.followedTopics = followedTopics.split(',');
      }
      if(this.tag===undefined){
        this.until = Date.now();
        this.limit = 15;
        this.getEvents();
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
      let topic = params['topic'];
      if(topic){
      this.tag = topic.toLowerCase();
      } else {
        this.tag = undefined;
      }
      this.until = Date.now();
      this.limit = 15;
      this.getEvents();
    });
  }

  async getEvents() {
    this.loadingEvents = true;
    this.loadingNextEvents = false;
    this.reachedEndOfFeed = false;
    if (this.tag && this.tag !== '') {
      const fetchedEvents = await this.ndkProvider.fetchEvents(this.tag || '', this.limit, undefined, this.until);
      if(fetchedEvents){
        this.removeMutedAndSetEvents(fetchedEvents);
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
          this.removeMutedAndSetEvents(fetchedEvents);
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
      this.nextEvents = await this.ndkProvider.fetchEvents(this.tag || '', this.limit, undefined, this.until);
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
        this.nextEvents = await this.ndkProvider.fetchAllFollowedEvents(
          this.ndkProvider.appData.followedTopics.split(','),
          this.limit,
          undefined,
          this.until
        );
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
      let timestampsOfEvents: (number | undefined)[] = Array.from(this.events).map(ndkEvent => {
        return ndkEvent.created_at;
      });
      return Math.min(...(timestampsOfEvents as number[]));
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
    this.until = this.getOldestEventTimestamp();
    this.getEventsForNextPage();
  }

  ngOnDestroy(): void {
    this.fetchingPeopleIFollowFromRelaySub.unsubscribe();
  }
}
