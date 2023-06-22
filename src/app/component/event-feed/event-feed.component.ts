import { Constants } from 'src/app/util/Constants';
import { Component, EventEmitter, Input, Output, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import { TopicService } from 'src/app/service/topic.service';
import { HashTagFilter } from 'src/app/filter/HashTagFilter';
import { Subscription } from 'rxjs';
import { EventBuffer } from 'src/app/buffer/EventBuffer';
import { ReverseChrono } from 'src/app/sortlogic/ReverseChrono';
import { SortLogic } from 'src/app/sortlogic/SortLogic';
import { NDKEventWithEngagement } from 'src/app/custom-type/NDKEventWithEngagement';
import { TopZapsUpMinusDown } from 'src/app/sortlogic/TopZapsUpMinusDown';
import { TopVotesUpMinusDown } from 'src/app/sortlogic/TopVotesUpMinusDown';
import { BestZapsUpDownRatio } from 'src/app/sortlogic/BestZapsUpDownRatio';
import { BestVotesUpDownRatio } from 'src/app/sortlogic/BestVotesUpDownRatio';
import { HotVotesTimesTime } from 'src/app/sortlogic/HotVotesTimesTime';

const BUFFER_REFILL_PAGE_SIZE = 60;
const BUFFER_READ_PAGE_SIZE = 20;
const DEFAULT_REVERSE_CHRONO = 'default-reverse-chrono';
const TOP_ZAPS_UP_MINUS_DOWN  = 'top-zaps-up-minus-down';
const TOP_VOTES_UP_MINUS_DOWN = 'top-votes-up-minus-down';
const BEST_ZAPS_UP_DOWN_RATIO = 'best-zaps-up-down-ratio';
const BEST_VOTES_UP_DOWN_RATIO = 'best-votes-up-down-ratio';
const HOT_VOTES_TIMES_TIME = 'hot-votes-times-time';
const CONTROVERSIAL_VOTES_UP_DOWN_BALANCE = 'controversial-votes-up-down-balance';
const CONTROVERSIAL_ZAPS_UP_DOWN_BALANCE = 'controverial-zaps-up-down-balance';


const reverseChronoSortLogic:SortLogic = new ReverseChrono(); 



@Component({
  selector: 'app-event-feed',
  templateUrl: './event-feed.component.html',
  styleUrls: ['./event-feed.component.scss'],
})
export class EventFeedComponent implements OnInit, OnDestroy {
  until: number | undefined = Date.now();
  limit: number | undefined = BUFFER_REFILL_PAGE_SIZE;
  loadingEvents: boolean = false;
  loadingNextEvents: boolean = false;
  reachedEndOfFeed: boolean = false;
  peopleIFollowLoadedFromRelay: boolean = false;
  fetchingPeopleIFollowFromRelaySub: Subscription = new Subscription();
  currentSortLogic: SortLogic = reverseChronoSortLogic;
  isAdvancedSortEnabled: boolean = true;
  preparingAdvanceSorts: boolean = false;
  advancedSortsAvailable: boolean = false;
  advanceSortPreparationProgress:number = 0;
  currentSortName?:string = DEFAULT_REVERSE_CHRONO;
  advancedSortWarningModalOpen:boolean = false;

  @Input()
  tag: string | undefined;

  @Output()
  followChanged: EventEmitter<string> = new EventEmitter<string>();

  followedTopics: string[] | undefined;
  events: Set<NDKEvent> | undefined;
  nextEvents: Set<NDKEvent> | undefined;
  isLoggedInUsingPubKey: boolean = false;
  chronoEventBuffer: EventBuffer<NDKEvent> = new EventBuffer<NDKEvent>(undefined,DEFAULT_REVERSE_CHRONO);
  nowShowingUptoIndex: number = 0;
  currentEventBuffer?: EventBuffer<NDKEvent>;
  advancedEventBuffers:Map<string,EventBuffer<NDKEventWithEngagement>> = new Map<string,EventBuffer<NDKEventWithEngagement>>();

  ndkProvider: NdkproviderService;

  ngOnInit(): void {
    this.ndkProvider.followedTopicsEmitter.subscribe((followedTopics: string) => {
      if (followedTopics === '') {
        this.followedTopics = [];
      } else {
        this.followedTopics = followedTopics.split(',');
      }
      if (this.tag === undefined) {
        this.nowShowingUptoIndex = 0;
        this.chronoEventBuffer.events = [];
        this.until = Date.now();
        this.limit = BUFFER_REFILL_PAGE_SIZE;
        this.getEventsAndFillBuffer();
      }
    });

    this.ndkProvider.isLoggedInUsingPubKey$.subscribe(val => {
      this.isLoggedInUsingPubKey = val;
    });

    this.fetchingPeopleIFollowFromRelaySub = this.ndkProvider.fetchingPeopleIFollowFromRelay$.subscribe(val => {
      if (val === false && localStorage.getItem(Constants.FOLLOWERS_FROM_RELAY) === 'false') {
        this.peopleIFollowLoadedFromRelay = true;
      }
    });
  }

  constructor(ndkProvider: NdkproviderService, private topicService: TopicService, private route: ActivatedRoute) {
    this.ndkProvider = ndkProvider;

    const followedTopicsByNdk = ndkProvider.appData.followedTopics;
    if (followedTopicsByNdk === '') {
      this.followedTopics = [];
    } else {
      this.followedTopics = followedTopicsByNdk.split(',');
    }

    route.params.subscribe(params => {
      this.nowShowingUptoIndex = 0;
      this.advanceSortPreparationProgress = 0;
      this.preparingAdvanceSorts = false;
      this.advancedSortsAvailable = false;
      this.advancedEventBuffers =  new Map<string,EventBuffer<NDKEventWithEngagement>>()
      this.chronoEventBuffer.events = [];
      this.currentEventBuffer = this.chronoEventBuffer;
      let topic = params['topic'];
      if (topic) {
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
      if (fetchedEvents) {
        const sorted = [...fetchedEvents].slice(0,BUFFER_REFILL_PAGE_SIZE).sort(this.currentSortLogic.compare);
        this.chronoEventBuffer.refillWithEntries(sorted);
        const eventsToAddToDisplay = this.chronoEventBuffer.getItemsWithIndexes(
          this.nowShowingUptoIndex,
          BUFFER_READ_PAGE_SIZE - 1
        );
        if (eventsToAddToDisplay) {
          this.removeMutedAndSetEvents(new Set<NDKEvent>(eventsToAddToDisplay));
          this.nowShowingUptoIndex += BUFFER_READ_PAGE_SIZE;
        }        
      }
      this.loadingEvents = false;
    } else {
      if (this.ndkProvider.appData.followedTopics.length > 0) {
        const fetchedEvents = await this.ndkProvider.fetchAllFollowedEvents(
          this.ndkProvider.appData.followedTopics.split(','),
          this.limit,
          undefined,
          this.until
        );
        if (fetchedEvents) {
          const sorted = [...fetchedEvents].sort(this.currentSortLogic.compare);
          this.chronoEventBuffer.refillWithEntries(sorted);
          const eventsToAddToDisplay = this.chronoEventBuffer.getItemsWithIndexes(
            this.nowShowingUptoIndex,
            BUFFER_READ_PAGE_SIZE - 1
          );
          if (eventsToAddToDisplay) {
            this.removeMutedAndSetEvents(new Set<NDKEvent>(eventsToAddToDisplay));
            this.nowShowingUptoIndex += BUFFER_READ_PAGE_SIZE;
          }          
        }
      }
      this.loadingEvents = false;
    }
  }

  attemptPreparingAdvancedSorts(){
    this.advancedSortWarningModalOpen = false;
    if (this.isAdvancedSortEnabled) {
      this.preparingAdvanceSorts = true;
      this.prepareAdvancedSorts(new Set<NDKEvent>(this.chronoEventBuffer.events!.slice(0,BUFFER_REFILL_PAGE_SIZE))).then(()=>{
        this.preparingAdvanceSorts = false;
      });
    }
  }

  private removeMutedAndSetEvents(fetchedEvents: Set<NDKEvent>) {
    let mutedTopicsArr: string[] = [];
    if (this.ndkProvider.appData.mutedTopics && this.ndkProvider.appData.mutedTopics !== '') {
      mutedTopicsArr = this.ndkProvider.appData.mutedTopics.split(',');
    }
    this.events = new Set([...fetchedEvents].filter(HashTagFilter.notHashTags(mutedTopicsArr)));
  }

  addEventToFeed(postedEvent: NDKEvent) {
    if (this.events) {
      this.removeMutedAndSetEvents(new Set([postedEvent].concat(...this.events)));
    } else {
      this.removeMutedAndSetEvents(new Set([postedEvent]));
    }
  }

  async getEventsForNextPage() {
    this.loadingNextEvents = true;
    this.reachedEndOfFeed = false;
    if (this.tag && this.tag !== '') {
      this.nextEvents = new Set<NDKEvent>(
        this.chronoEventBuffer.getItemsWithIndexes(
          this.nowShowingUptoIndex,
          this.nowShowingUptoIndex + BUFFER_READ_PAGE_SIZE - 1
        )
      );
      if (this.nextEvents.size === 0) {
        if(this.currentSortName === DEFAULT_REVERSE_CHRONO){  //refill buffer only when default sort is applied, else show end of feed
          this.until = this.getOldestEventTimestamp();
          const nextBatch = await this.ndkProvider.fetchEvents(this.tag || '', this.limit, undefined, this.until);
          if (nextBatch) {
            const sorted = [...nextBatch].sort(this.currentSortLogic.compare);
            this.chronoEventBuffer.refillWithEntries(sorted);
            this.nextEvents = new Set<NDKEvent>(
              this.chronoEventBuffer.getItemsWithIndexes(this.nowShowingUptoIndex, BUFFER_READ_PAGE_SIZE - 1)
            );
          }
        }
      }
      this.nowShowingUptoIndex += BUFFER_READ_PAGE_SIZE;

      if (this.nextEvents && this.nextEvents.size > 0) {
        if (this.events) {
          let mutedTopicsArr: string[] = [];
          if (this.ndkProvider.appData.mutedTopics && this.ndkProvider.appData.mutedTopics !== '') {
            mutedTopicsArr = this.ndkProvider.appData.mutedTopics.split(',');
          }
          [...this.nextEvents].filter(HashTagFilter.notHashTags(mutedTopicsArr)).forEach(this.events.add, this.events);
          this.loadingNextEvents = false;
          this.nextEvents = undefined;
        }
      } else {
        this.reachedEndOfFeed = true;
      }
    } else {
      if (this.followedTopics && this.followedTopics.length > 0) {
        this.nextEvents = new Set<NDKEvent>(
          this.chronoEventBuffer.getItemsWithIndexes(
            this.nowShowingUptoIndex,
            this.nowShowingUptoIndex + BUFFER_READ_PAGE_SIZE - 1
          )
        );
        if (this.nextEvents.size === 0) {
          if(this.currentSortName === DEFAULT_REVERSE_CHRONO){
            const nextBatch = await this.ndkProvider.fetchAllFollowedEvents(
              this.ndkProvider.appData.followedTopics.split(','),
              this.limit,
              undefined,
              this.until
            );
            if (nextBatch) {
              const sorted = [...nextBatch].sort(this.currentSortLogic.compare);
              this.chronoEventBuffer.refillWithEntries(sorted);
              this.nextEvents = new Set<NDKEvent>(
                this.chronoEventBuffer.getItemsWithIndexes(this.nowShowingUptoIndex, BUFFER_READ_PAGE_SIZE - 1)
              );
            }
          }
        }
        this.nowShowingUptoIndex += BUFFER_READ_PAGE_SIZE;
      }
      if (this.nextEvents && this.nextEvents.size > 0) {
        if (this.events) {
          let mutedTopicsArr: string[] = [];
          if (this.ndkProvider.appData.mutedTopics && this.ndkProvider.appData.mutedTopics !== '') {
            mutedTopicsArr = this.ndkProvider.appData.mutedTopics.split(',');
          }
          [...this.nextEvents].filter(HashTagFilter.notHashTags(mutedTopicsArr)).forEach(this.events.add, this.events);
          this.loadingNextEvents = false;
          this.nextEvents = undefined;
        }
      } else {
        this.reachedEndOfFeed = true;
      }
    }
  }

  getOldestEventTimestamp(): number | undefined {
    if (this.events) {
      // let timestampsOfEvents: (number | undefined)[] = Array.from(this.events).map(ndkEvent => {
      //   return ndkEvent.created_at;
      // });
      // return Math.min(...(timestampsOfEvents as number[]));

      return this.currentEventBuffer!.events![this.currentEventBuffer!.events!.length - 1].created_at!;
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

  async prepareAdvancedSorts(fetchedEvents: Set<NDKEvent>) {
    const ndkEventsWithEngagement: NDKEventWithEngagement[] = await this.fetchAllEngagements(fetchedEvents);
    await this.doAdvancedSorts(ndkEventsWithEngagement);
    this.advancedSortsAvailable = true;
  }

  async fetchAllEngagements(fetchedEvents: Set<NDKEvent>): Promise<NDKEventWithEngagement[]> {
    let returnEvents: NDKEventWithEngagement[] = [];
    let count = 0;
    for (let currentEvent of fetchedEvents) {
      const reactions: Set<NDKEvent> | undefined = await this.ndkProvider.fetchReactions(currentEvent);
      let downVotes = 0;
      let upVotes = 0;
      if (reactions) {
        downVotes = [...reactions].filter((reaction: NDKEvent) => reaction.content.indexOf('-') > -1).length;
        upVotes = reactions.size - downVotes;
      }

      // const zaps: Set<NDKEvent> | undefined = await this.ndkProvider.fetchZaps(currentEvent);
      // let upZaps = 0;
      // let downZaps = 0;
      // if (zaps) {
      //   downZaps = [...zaps].filter(zap => {
      //     return Util.isDownzap(zap);
      //   }).length;
      //   upZaps = zaps.size - downZaps;
      // }

      const currentEventWithEngagement: NDKEventWithEngagement = currentEvent as NDKEventWithEngagement;
      currentEventWithEngagement.downvotes = downVotes;
      currentEventWithEngagement.upvotes = upVotes;
      // currentEventWithEngagement.upzaps = upZaps;
      // currentEventWithEngagement.downzaps = downZaps;
      returnEvents.push(currentEventWithEngagement);
      this.advanceSortPreparationProgress = Math.round((++count/(fetchedEvents.size))*100);

    }
    return returnEvents;
  }

  async doAdvancedSorts(eventsWithEngagement:NDKEventWithEngagement[]){
    /*
      const TOP_ZAPS_UP_MINUS_DOWN  = 'top-zaps-up-minus-down';
      const TOP_VOTES_UP_MINUS_DOWN = 'top-votes-up-minus-down';
      const BEST_ZAPS_UP_DOWN_RATIO = 'best-zaps-up-down-ratio';
      const BEST_VOTES_UP_DOWN_RATIO = 'best-votes-up-down-ratio';
      const CONTROVERSIAL_VOTES_UP_DOWN_BALANCE = 'controversial-votes-up-down-balance';
      const CONTROVERSIAL_ZAPS_UP_DOWN_BALANCE = 'controverial-zaps-up-down-balance';
    */
    //await this.populateAdvancedBufferFromEvents(eventsWithEngagement,TOP_ZAPS_UP_MINUS_DOWN,new TopZapsUpMinusDown());
    await this.populateAdvancedBufferFromEvents(eventsWithEngagement,TOP_VOTES_UP_MINUS_DOWN,new TopVotesUpMinusDown());
   // await this.populateAdvancedBufferFromEvents(eventsWithEngagement,BEST_ZAPS_UP_DOWN_RATIO,new BestZapsUpDownRatio());
    await this.populateAdvancedBufferFromEvents(eventsWithEngagement,BEST_VOTES_UP_DOWN_RATIO,new BestVotesUpDownRatio());
    await this.populateAdvancedBufferFromEvents(eventsWithEngagement,HOT_VOTES_TIMES_TIME,new HotVotesTimesTime());

  }

  switchBuffer(bufferType:string){
    this.currentEventBuffer = this.advancedEventBuffers.get(bufferType);
    if(this.currentEventBuffer === undefined){
      this.currentEventBuffer = this.chronoEventBuffer;
    }
    this.nowShowingUptoIndex = 0;
    this.events = new Set<NDKEvent>();
    const eventsToAddToDisplay = this.currentEventBuffer!.getItemsWithIndexes(
      this.nowShowingUptoIndex,
      BUFFER_READ_PAGE_SIZE - 1
    );
    if (eventsToAddToDisplay) {
      this.removeMutedAndSetEvents(new Set<NDKEvent>(eventsToAddToDisplay));
      this.nowShowingUptoIndex += BUFFER_READ_PAGE_SIZE;
    }
    this.currentSortName = bufferType;
  }

  async populateAdvancedBufferFromEvents(eventsWithEngagement:NDKEventWithEngagement[],bufferType:string,sortLogic: SortLogic){
    this.advancedEventBuffers.set(bufferType,new EventBuffer([...eventsWithEngagement].sort(sortLogic.compare), bufferType));
  }

  loadMoreEvents() {
    this.getEventsForNextPage();
  }

  ngOnDestroy(): void {
    this.fetchingPeopleIFollowFromRelaySub.unsubscribe();
  }
}

