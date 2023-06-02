import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import { TopicService } from 'src/app/service/topic.service';
import { ZappeditdbService } from '../../service/zappeditdb.service';
import { User } from '../../model/user';
import { HashTagFilter } from 'src/app/filter/HashTagFilter';

@Component({
  selector: 'app-event-feed',
  templateUrl: './event-feed.component.html',
  styleUrls: ['./event-feed.component.scss'],
})
export class EventFeedComponent {
  until: number | undefined = Date.now();
  limit: number | undefined = 25;
  loadingEvents: boolean = false;
  loadingNextEvents: boolean = false;
  reachedEndOfFeed : boolean = false;

  @Input()
  tag: string | undefined;

  @Output()
  followChanged: EventEmitter<string> = new EventEmitter<string>();

  followedTopics: string[]|undefined;
  events: Set<NDKEvent> | undefined;
  nextEvents: Set<NDKEvent> | undefined;

  ndkProvider: NdkproviderService;

  ngOnInit() {
    this.ndkProvider.followedTopicsEmitter.subscribe((followedTopics: string) => {
      if (followedTopics === '') {
        this.followedTopics = [];
      } else {
        this.followedTopics = followedTopics.split(',');
      }
      if(this.tag===undefined){
        this.until = Date.now();
        this.limit = 25;
        this.getEvents();
      }
    });
  }

  constructor(ndkProvider: NdkproviderService, private topicService: TopicService,
    private route: ActivatedRoute) {
    console.log("creating feed component")
    this.ndkProvider = ndkProvider;

    const followedTopicsByNdk = ndkProvider.appData.followedTopics;
    if (followedTopicsByNdk === '') {
      this.followedTopics = [];
    } else {
      this.followedTopics = followedTopicsByNdk.split(',');
    }

    this.fetchPeopleIFollowList();
    //this.fetchPeopleIMutedList();

    route.params.subscribe(params => {
      let topic = params['topic'];
      if(topic){
      this.tag = topic.toLowerCase();
      } else {
        this.tag = undefined;
      }
      this.until = Date.now();
      this.limit = 25;
      this.getEvents();
    });
  }

  fetchPeopleIFollowList(){
    this.ndkProvider.fetchFollowersFromCache().then((cachedUsers:User[]) =>{});
  }

  fetchPeopleIMutedList(){
    this.ndkProvider.fetchMutedUsersFromCache().then((cachedUsers:User[]) =>{});
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
}
