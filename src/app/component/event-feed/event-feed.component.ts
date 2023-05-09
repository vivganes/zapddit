import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import { TopicService } from 'src/app/service/topic.service';

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

  private ndkProvider: NdkproviderService;
  private topicService: TopicService;
  followedTopics: string[] = [];
  events: Set<NDKEvent> | undefined;
  nextEvents: Set<NDKEvent> | undefined;
  ngOnInit() {
    if (this.topicService.followedTopics === '') {
      this.followedTopics = [];
    } else {
      this.followedTopics = this.topicService.followedTopics.split(',');
    }
  }

  constructor(ndkProvider: NdkproviderService, topicService: TopicService, route: ActivatedRoute) {
    this.ndkProvider = ndkProvider;
    this.topicService = topicService;
    route.params.subscribe(params => {
      this.tag = params['topic'];
      this.until = Date.now();
      this.limit = 25;
      this.getEvents();
    });
  }

  async getEvents() {
    this.loadingEvents = true;
    this.reachedEndOfFeed = false;
    if (this.tag && this.tag !== '') {
      this.events = await this.ndkProvider.fetchEvents(this.tag || '', this.limit, undefined, this.until);
      this.loadingEvents = false;
    } else {
      this.events = await this.ndkProvider.fetchAllFollowedEvents(
        this.topicService.followedTopics.split(','),
        this.limit,
        undefined,
        this.until
      );
      this.loadingEvents=false;
    }
  }

  async getEventsForNextPage() {
    this.loadingNextEvents = true;
    this.reachedEndOfFeed = false;
    if (this.tag && this.tag !== '') {
      this.nextEvents = await this.ndkProvider.fetchEvents(this.tag || '', this.limit, undefined, this.until);
      if(this.nextEvents && this.nextEvents.size>0){
        if(this.events){
          this.nextEvents?.forEach(this.events.add,this.events)
          this.loadingNextEvents = false;
          this.nextEvents =undefined;
        }    
      } else {
        this.reachedEndOfFeed = true
      }        
    } else {
      this.nextEvents = await this.ndkProvider.fetchAllFollowedEvents(
        this.topicService.followedTopics.split(','),
        this.limit,
        undefined,
        this.until
      );
      if(this.nextEvents && this.nextEvents.size>0){
        if(this.events){
          this.nextEvents?.forEach(this.events.add,this.events)
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
      this.followChanged.emit();
      this.followedTopics = this.topicService.followedTopics.split(',');
    }
  }

  unfollowTopic(topic: string | undefined) {
    if (topic) {
      this.topicService.unfollowTopic(topic);
      this.followChanged.emit();
      if (this.topicService.followedTopics.length === 0) {
        this.followedTopics = [];
      } else {
        this.followedTopics = this.topicService.followedTopics.split(',');
      }
    }
  }

  isTopicFollowed(topic: string | undefined): boolean {
    if (topic) {
      if (this.followedTopics.indexOf(topic) > -1) {
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
