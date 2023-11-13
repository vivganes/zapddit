
import { EventEmitter, Injectable, Output } from '@angular/core';
import { IndexableType, Table } from 'dexie';
import NDK, {
  type NDKConstructorParams,
  NDKNip07Signer,
  NDKUser,
  type NDKUserProfile,
  NDKFilter,
  NDKEvent,
  NostrEvent,
  NDKTag,
  NDKSubscription,
  NDKSigner,
  NDKPrivateKeySigner,
  NDKKind,
  NDKRelay,
  NDKRelayList
} from '@nostr-dev-kit/ndk';
import { nip57 } from 'nostr-tools';
import { bech32 } from '@scure/base';
import { LoginUtil, NewCredential } from '../util/LoginUtil';
import { ZappeditdbService } from './zappeditdb.service';
import { Relay } from '../model';
import { Constants } from '../util/Constants';
import { BehaviorSubject, retry } from 'rxjs';
import { Community } from '../model/community';
import { ObjectCacheService } from './object-cache.service';
import { User } from '../model/user';
import hashtag from '../util/IntlHashtagLinkifyPlugin';
import { CommunityCacheService } from './community-cache.service';
import NDKCacheAdapterDexie from "@nostr-dev-kit/ndk-cache-dexie";

const dexieAdapter = new NDKCacheAdapterDexie({ dbName: 'ndk-cache' });

interface ZappedItAppData {
  followedTopics: string;
  downzapRecipients: string;
  mutedTopics:string;
  followedCommunities:string;
}

interface MutedUserMetaData{
  status:boolean;
  count:number;
}

const explicitRelayUrls = ['wss://nos.lol',
'wss://relay.nostr.band',
'wss://relay.f7z.io',
'wss://relay.damus.io',
'wss://nostr.mom']; //TODO: fix this

@Injectable({
  providedIn: 'root',
})
export class NdkproviderService {
  ndk: NDK | undefined;
  currentUserProfile: NDKUserProfile | undefined;
  currentUser: NDKUser | undefined;
  currentUserNpub: string | undefined;
  appData: ZappedItAppData = {
    followedTopics: '',
    downzapRecipients: '',
    mutedTopics: '',
    followedCommunities:''
  };

  isNip05Verified$ = new BehaviorSubject<boolean>(false);
  fetchingPeopleIFollowFromRelay$ = new BehaviorSubject<boolean>(true);
  fetchingMutedUsersFromRelay$ = new BehaviorSubject<MutedUserMetaData>({ status: true, count: 0 });
  defaultSatsForZaps: number = 1;
  loggedIn: boolean = false;
  loggingIn: boolean = false;
  loginError: string | undefined;
  loadingCommunitiesEmitter$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  loginCompleteEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();
  followedTopicsEmitter: EventEmitter<string> = new EventEmitter<string>();
  followedCommunitiesEmitter: EventEmitter<string> = new EventEmitter<string>();
  peopleIFollowEmitter: NDKSubscription | undefined;
  private signer: NDKSigner | undefined = undefined;
  isNip07 = false;
  isLoggedInUsingPubKey$ = new BehaviorSubject<boolean>(false);
  isLoggedInUsingNsec: boolean = false;
  isTryingZapddit: boolean = false;
  isNewToNostr: boolean = false;
  mutedTopicsEmitter: EventEmitter<string> = new EventEmitter<string>();
  appDataEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();
  canWriteToNostr: boolean = false;
  @Output()
  launchOnboardingWizard: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(private dbService: ZappeditdbService,
    private objectCache: ObjectCacheService,
    private communityCache: CommunityCacheService) {
    const npubFromLocal = localStorage.getItem(Constants.NPUB);
    const privateKey = localStorage.getItem(Constants.PRIVATEKEY);
    const loggedInPubKey = localStorage.getItem(Constants.LOGGEDINUSINGPUBKEY);
    const tryingZapddit = localStorage.getItem(Constants.TRYING_ZAPDDIT);
    localStorage.setItem(Constants.FOLLOWERS_FROM_RELAY, 'false');
    if (tryingZapddit && tryingZapddit == 'true') {
      this.startWithUnauthSession();
    } else {
      if (npubFromLocal && npubFromLocal !== '') {// we can login as the login has already happened
        if (privateKey && privateKey !== '') {
          this.isNip07 = false;
          this.isLoggedInUsingNsec = true;
          this.signer = new NDKPrivateKeySigner(privateKey);
          this.canWriteToNostr = true;
          this.tryLoginUsingNpub(npubFromLocal);
        } else {
          if (loggedInPubKey && loggedInPubKey !== '') {
            this.isNip07 = false;
            this.isLoggedInUsingPubKey$.next(true);
          } else {
            this.isNip07 = true;
            this.canWriteToNostr = true;
          }
          this.tryLoginUsingNpub(npubFromLocal);
        }
      } else {
        this.startWithUnauthSession()
      }
    }
  }

  createNDKEvent(): NDKEvent{
    return new NDKEvent(this.ndk);
  }


  private async startWithUnauthSession() {
    this.loginCompleteEmitter.emit(false);
    this.loggingIn = true;
    this.canWriteToNostr = false;
    this.isTryingZapddit = true;
    const followedTopicsFromLocal = localStorage.getItem(Constants.FOLLOWEDTOPICS);
    const mutedTopicsFromLocal = localStorage.getItem(Constants.MUTEDTOPICS);
    const communitiesFromLocal = localStorage.getItem(Constants.FOLLOWEDCOMMUNITIES)
    this.appData.followedTopics = followedTopicsFromLocal || '';
    this.appData.mutedTopics = mutedTopicsFromLocal || '';
    this.appData.followedCommunities = communitiesFromLocal || '';
    console.log(this.appData.followedTopics);
    this.followedTopicsEmitter.emit(this.appData.followedTopics);
    this.mutedTopicsEmitter.emit(this.appData.mutedTopics);
    this.followedCommunitiesEmitter.emit(this.appData.followedCommunities)
    this.currentUserProfile = {
      displayName: 'Lurky Lurkerson',
    };
    this.ndk = new NDK({
      cacheAdapter: dexieAdapter,
      explicitRelayUrls: explicitRelayUrls,
    });
    await this.ndk.connect(1000);
    this.loggedIn = true;
    this.loggingIn = false;
    this.loginCompleteEmitter.emit(true);
  }

  attemptLoginUsingPrivateOrPubKey(enteredKey: string) {
    try {
      this.loginCompleteEmitter.emit(false);
      this.loggingIn = true;
      this.loginError = undefined;
      const hexPrivateKey = this.validateAndGetHexKey(enteredKey);
      if (enteredKey.startsWith('nsec')) {
        this.signer = new NDKPrivateKeySigner(hexPrivateKey);
        this.signer.user().then(user => {
          localStorage.setItem(Constants.PRIVATEKEY, hexPrivateKey);
          localStorage.setItem(Constants.NPUB, user.npub);
          this.isTryingZapddit = false;
          this.isLoggedInUsingNsec = true;
          this.canWriteToNostr = true;
          this.tryLoginUsingNpub(user.npub);
        });
      } else if (enteredKey.startsWith('npub')) {
        this.isTryingZapddit = false;
        localStorage.setItem(Constants.NPUB, enteredKey);
        localStorage.setItem(Constants.LOGGEDINUSINGPUBKEY, 'true');
        this.isLoggedInUsingPubKey$.next(true);
        this.tryLoginUsingNpub(enteredKey);
      } else {
        this.loginError = 'Invalid input. Enter either nsec or npub id';
      }
      this.loggingIn = false;
    } catch (e: any) {
      console.error(e);
      this.loginError = e.message;
      this.loggingIn = false;
    }
  }

  setAsNewToNostr() {
    this.isNewToNostr = true;
  }

  setNotNewToNostr() {
    this.isNewToNostr = false;
  }

  async createNewUserOnNostr(displayName: string) {
    if (this.canWriteToNostr) {
      //create a relay follow list event and send it across
      const relayEvent: NDKEvent = new NDKEvent(this.ndk);
      relayEvent.kind = 10002;
      relayEvent.content = '';
      relayEvent.tags = await this.getSuggestedRelays();
      console.log(relayEvent);
      relayEvent.publish();

      //create new profile event and send it across
      const newProfileEvent: NDKEvent = new NDKEvent(this.ndk);
      newProfileEvent.kind = 0;
      newProfileEvent.content = `{"display_name": "${displayName}", "name": "${displayName}"}`;
      console.log(newProfileEvent);
      await newProfileEvent.publish();
    }
    this.currentUserProfile = {
      name: displayName,
      displayName: displayName,
    };
  }

  async getSuggestedRelays(): Promise<NDKTag[]> {
    const relayTags = explicitRelayUrls.map(val => ['r', val]);
    return relayTags;
  }

  attemptToGenerateNewCredential() {
    const newCredential: NewCredential = LoginUtil.generateNewCredential();
    this.attemptLoginUsingPrivateOrPubKey(newCredential.privateKey);
    this.launchOnboardingWizard.emit(true);
  }

  async attemptToTryUnauthenticated() {
    this.isTryingZapddit = true;
    this.canWriteToNostr = false;
    localStorage.setItem(Constants.TRYING_ZAPDDIT, 'true');
    this.currentUserProfile = {
      displayName: 'Lurky Lurkerson',
    };
    this.ndk = new NDK({      
      cacheAdapter: dexieAdapter,
      explicitRelayUrls: explicitRelayUrls,
      autoConnectUserRelays: true,
      autoFetchUserMutelist: true
    });
    await this.ndk.connect(1000);
    this.loggedIn = true;
    this.loginCompleteEmitter.emit(true);
    this.launchOnboardingWizard.emit(true);
  }

  validateAndGetHexKey(enteredKey: string): string {
    if (!enteredKey || enteredKey === '' || enteredKey == null) {
      throw new Error('Key to login is required');
    }
    return LoginUtil.getHexFromPrivateOrPubKey(enteredKey);
  }

  async tryLoginUsingNpub(npubFromLocal: string) {
    this.loggingIn = true;
    this.loginError = undefined;
    if (this.isNip07) {
      while (!window.hasOwnProperty('nostr')) {
        // define the condition as you like
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      console.log('Found window nostr');
      this.signer = new NDKNip07Signer();
    }

    const params: NDKConstructorParams = { 
      cacheAdapter: dexieAdapter, signer: this.signer, 
      explicitRelayUrls: explicitRelayUrls,
      autoConnectUserRelays: true,
      autoFetchUserMutelist: true
     };
    this.ndk = new NDK(params);

    await this.ndk.connect(1000);
    this.initializeUsingNpub(npubFromLocal);
  }

  attemptLoginWithNip07() {
    this.loggingIn = true;
    this.canWriteToNostr = true;
    this.resolveNip07Extension();
  }

  private resolveNip07Extension() {
    (async () => {
      console.log('waiting for window.nostr');
      while (!window.hasOwnProperty('nostr')) {
        // define the condition as you like
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // do this after window.nostr is available
      this.signer = new NDKNip07Signer();
      this.initializeClientWithSigner();
    })();
  }

  async getProfileFromNpub(npub: string): Promise<NDKUserProfile | undefined> {
    const user = await this.getNdkUserFromNpub(npub)
    return user?.profile;
  }

  async fetchFollowersFromNpub(npub: string): Promise<Set<NDKUser> | undefined> {
    const user = this.ndk?.getUser({ npub });
    const ndkUsers = await user?.follows();
    return ndkUsers;
  }

  async getNdkUserFromNpub(npub: string): Promise<NDKUser | undefined> {
    try {
      const entryFromCache = await this.objectCache.fetchUserWithNpub(npub,this.ndk!);
      if(entryFromCache){
        return entryFromCache;
      }

      let user: NDKUser | undefined;
      user = this.ndk?.getUser({npub: npub});
      if(user){
        await user?.fetchProfile();
        this.objectCache.addUser(user)
      }
      return user;
    } catch (e) {
      console.log(e);
      return undefined;
    }
  }

  async getProfileFromHex(hexpubkey: string): Promise<NDKUserProfile | undefined> {
    const user = await this.getNdkUserFromHex(hexpubkey);
    return user?.profile;
  }

  async getNdkUserFromHex(hexpubkey: string): Promise<NDKUser | undefined> {
    const entryFromCache = await this.objectCache.fetchUserWithHexKey(hexpubkey);
    if(entryFromCache){
      return entryFromCache;
    }

    const user = this.ndk?.getUser({ hexpubkey });
    if(user){
      await user?.fetchProfile();
      this.objectCache.addUser(user);
    }
    return user;
  }

  private async initializeClientWithSigner() {
    try {
      this.signer?.user().then(async user => {
        let relayUrls: string[] | undefined = [];
        if(localStorage.getItem(Constants.RELAYSUBS) !== undefined) {
          relayUrls = localStorage.getItem(Constants.RELAYSUBS)?.split(',');
        }
        const params: NDKConstructorParams = { 
          cacheAdapter: dexieAdapter, signer: this.signer, 
          explicitRelayUrls: relayUrls ? relayUrls : explicitRelayUrls,
          autoConnectUserRelays: true,
          autoFetchUserMutelist: true };
        this.ndk = new NDK(params);
        await this.ndk.assertSigner();
        await this.ndk.connect(1000);
        if (user.npub) {
          console.log('Permission granted to read their public key:', user.npub);
          localStorage.setItem(Constants.NPUB, user.npub);
          await this.initializeUsingNpub(user.npub);
        } else {
          console.log('Permission not granted');
        }
      });
    } catch (err) {
      console.log(err);
    }
  }

  private async initializeUsingNpub(npub: string) {
    this.currentUserNpub = npub;
    this.currentUserProfile = await this.getProfileFromNpub(npub);
    this.currentUser = await this.getNdkUserFromNpub(npub);
    const userRelays = await this.fetchSubscribedRelaysFromCache();
    console.log(userRelays.length + " relays found")
    let relayUrls: string[] = [];
    userRelays.forEach(x => {
      if(x.url && x.url !== ''){
        relayUrls.push(x.url)
      }
    });
    localStorage.setItem(Constants.RELAYSUBS, relayUrls.join(','));

    // const relays = this.currentUser?.relayUrls;

    if (relayUrls && relayUrls.length > 0) {
      const newNDKParams = { 
        cacheAdapter: dexieAdapter, signer: this.signer,
         explicitRelayUrls: relayUrls,
         autoConnectUserRelays: true,
         autoFetchUserMutelist: true };
      const newNDK = new NDK(newNDKParams);
      if (this.isNip07) {
        await newNDK.assertSigner();
      }
      try {        
        const oldNDK = this.ndk;
        oldNDK?.removeAllListeners();
        console.log("trying to connect with new NDK...")
        newNDK.connect(1000)
        .then(()=>{
          console.log('ndk connected');
          this.isTryingZapddit = false;
          this.refreshAppData().then(() => {
            console.log('refreshed app data')
            this.ndk = newNDK;
            this.loggingIn = false;
            //once all setup is done, then only set loggedIn=true to start rendering
            this.startRendering();            
          });
        })
        .catch(e => console.log("come on.. ndk not loaded"));
      } catch (e) {
        console.log('Error in connecting NDK ' + e);
      }
    } else {
      this.refreshAppData().then(() => {
        console.log('refreshed app data')
        this.loggingIn = false;
        //once all setup is done, then only set loggedIn=true to start rendering
        this.startRendering();            
      });
    }
 
  }

  isLoggedIn(): boolean {
    return this.loggedIn;
  }

  getCurrentUserProfile(): NDKUserProfile | undefined {
    return this.currentUserProfile;
  }

  triggerOnboardingWizard(){
    this.launchOnboardingWizard.emit(true);
  }

  async sendNote(
    text: string,
    hashtags?: string[],
    userMentionsHex?: string[],
    postMentions?: string[],
    replyingToEvent?: NDKEvent,
    replyingToEventId?:string,
    community?: Community
  ): Promise<NDKEvent> {
    const ndkEvent = new NDKEvent(this.ndk);
    ndkEvent.kind = 1;
    ndkEvent.content = text;
    let tags: NDKTag[] = [];
    if (hashtags) {
      tags.push(...hashtags?.map(hashtag => ['t', hashtag.toLocaleLowerCase()]));
    }
    if (userMentionsHex) {
      tags.push(...userMentionsHex?.map(userMention => ['p', userMention]));
    }
    if (postMentions) {
      tags.push(...postMentions?.map(postMention => ['e', postMention, '', 'mention']));
    }
    if (replyingToEvent) {
      tags.push(...replyingToEvent.getMatchingTags('p'));
    }
    if(replyingToEventId) {
      tags.push(['e', replyingToEventId, '', 'reply']);
    }
    if (community) {
      tags.push(['a',community.id!])
      tags.push(['k','1'])
      ndkEvent.kind = 4549;
    }
    ndkEvent.tags = tags;
    if (this.currentUser) {
      ndkEvent.pubkey = this.currentUser?.pubkey;
    }
    if (this.canWriteToNostr) {
      await ndkEvent.publish();
    }
    return ndkEvent;
  }

  private startRendering() {
    this.loggedIn = true;
    this.loginCompleteEmitter.emit(true);

    this.fetchFollowersFromCache();
    this.fetchMutedUsersFromCache();
    this.checkIfNIP05Verified(this.currentUserProfile?.nip05, this.currentUser?.pubkey);
    this.loadCommunitiesToCache();
  }

  async updateRelays(relays: Relay[]): Promise<NDKEvent> {
    let tags: NDKTag[] = [];
    const ndkEvent = new NDKEvent(this.ndk);
    relays.forEach(relay => {
      let setting: string = '';
      if(!relay.read && relay.write) setting = 'write';
      else if(relay.read && !relay.write) setting = 'read';
      tags.push(['r', relay.url, setting])
    })
    ndkEvent.kind = 10002;
    ndkEvent.tags = tags;
    if (this.currentUser) ndkEvent.pubkey = this.currentUser.pubkey;
    if (this.canWriteToNostr){
      // console.log(ndkEvent);
      await ndkEvent.sign();
      await ndkEvent.publish();
    }
    const relayTags = ndkEvent.getMatchingTags('r');
    console.log(relayTags);
    this.setRelaysForCurrentNdk(relayTags)
    return ndkEvent;
  }

  setRelaysForCurrentNdk(relayTags:NDKTag[]){
    const newNdk = new NDK({      
      cacheAdapter: dexieAdapter,
      signer: this.signer,
      explicitRelayUrls: relayTags.map((tag) => tag[1]),
      autoConnectUserRelays: true,
      autoFetchUserMutelist: true
    })
    newNdk.connect(1000).then(()=>{
      this.ndk = newNdk;
    })
  }

  createSubscriptionForCommunityEvents(){
    //@ts-ignore
    return this.ndk.subscribe({ kinds: [4550] });
  }

  async fetchFollowersAndCache(peopleIFollowFromRelay: Set<NDKUser> | undefined) {
    if (peopleIFollowFromRelay) {
      localStorage.setItem(Constants.FOLLOWERS_FROM_RELAY, 'true');
      this.fetchingPeopleIFollowFromRelay$.next(true);
      this.dbService.peopleIFollow.clear();
      console.log('People I follow db cleared');

      var ndkUsersArray = Array.from(peopleIFollowFromRelay);

      console.log('Fetching People I follow users profile');

      // for(var item of ndkUsersArray){
      //     await item.fetchProfile();
      // }

      console.log('Done fetching People I follow users profile');

      var users = ndkUsersArray.map(item => {
        return {
          hexPubKey: item.pubkey,
          // name: item.profile?.name!,
          // displayName: item.profile?.displayName!,
          // nip05: item.profile?.nip05!,
          // npub: item.npub,
          // pictureUrl: item.profile?.image!,
          // about:item.profile?.about!
        };
      });

      await this.addToDBBulk(users, this.dbService.peopleIFollow);

      localStorage.setItem(Constants.FOLLOWERS_FROM_RELAY, 'false');

      this.fetchingPeopleIFollowFromRelay$.next(false);

      console.log('People I follow loaded');
    } else {
      this.fetchingPeopleIFollowFromRelay$.next(false);
      console.log('People I follow loaded - nothing to load');
    }
  }

  async addToDBBulk(items: User[], table: Table<User, IndexableType>) {
    console.debug('User bulk add - ' + table.name + ' ' + items.length + ' records');
    await table.bulkPut(items);
    console.debug('User bulk add done - ' + table.name);
  }

  async addToDB(item: NDKUser, table: Table<User, IndexableType>) {
    table
      .where('hexPubKey')
      .equalsIgnoreCase(item.pubkey)
      .and(user => user.displayName !== null && user.displayName !== undefined)
      .count()
      .then(async count => {
        if (count == 0) {
          table.add(
            {
              hexPubKey: item.pubkey,
              name: item.profile?.name!,
              displayName: item.profile?.displayName!,
              nip05: item.profile?.nip05!,
              npub: item.npub,
              pictureUrl: item.profile?.image!,
              about: item.profile?.about!,
            },
            item.npub
          );
          console.debug('user added to - ' + table.name);
        } else {
          console.debug('User already exists');
        }
      })
      .catch(e => console.error('db call - ' + e));
  }

  async fetchMutedPeopleAndCache(peopleIMutedFromRelay: (NDKUser | undefined)[]) {
    if (peopleIMutedFromRelay) {
      this.fetchingMutedUsersFromRelay$.next({ status: true, count: 0 });

      this.dbService.mutedPeople.clear();
      console.log('Muted people db cleared');

      if (peopleIMutedFromRelay.length != 0) {
        var ndkUsersArray = Array.from(peopleIMutedFromRelay);

        var users: User[] = [];

        for (var i = 0; i < ndkUsersArray.length; i++) {
          var item = ndkUsersArray[i];
          if (item) {
            users.push({
              hexPubKey: item.pubkey,
              name: item.profile?.name!,
              displayName: item.profile?.displayName!,
              nip05: item.profile?.nip05!,
              npub: item.npub,
              pictureUrl: item.profile?.image!,
              about: item.profile?.about!,
            });
          }
        }

        await this.addToDBBulk(users, this.dbService.mutedPeople);

        this.fetchingMutedUsersFromRelay$.next({ status: false, count: users.length });

        console.log('mutelist loaded');
      } else {
        this.fetchingMutedUsersFromRelay$.next({ status: false, count: 0 });

        console.log('mutelist loaded - nothing to load');
      }
    }
  }

  private async fetchMuteList(hexPubKey: string) {
    console.log('mutelist load begin');

    const filter: NDKFilter = { kinds: [30000], '#d': ['mute'], authors: [hexPubKey] };
    var mutedListResult = await this.ndk?.fetchEvents(filter);

    var mutedListEvent: NDKEvent = mutedListResult?.values().next().value;

    var mutedNDKUsers: (NDKUser | undefined)[] = [];

    if (mutedListEvent) {
      var mutedList = mutedListEvent?.tags.flat().filter(item => item !== 'd' && item !== 'p' && item !== 'mute');

      console.log('mutedList - ' + mutedList.length);

      for (var i = 0; i < mutedList.length; i++) {
        var ndkUser = await this.getNdkUserFromHex(mutedList[i]);
        mutedNDKUsers.push(ndkUser);
      }
    }

    console.log('mutelist load ends - ' + mutedNDKUsers.length);
    return mutedNDKUsers;
  }

  async fetchFollowersFromCache(): Promise<User[]> {
    var peopleIFollowFromCache = await this.dbService.peopleIFollow.toArray();
    console.log('PeopleIFollow from cache ' + peopleIFollowFromCache?.length);

    var peopleIFollowFromRelay = await this.currentUser?.follows();
    console.log('PeopleIFollow from relay ' + peopleIFollowFromRelay?.size);

    if (
      peopleIFollowFromCache?.length === 0 ||
      (peopleIFollowFromCache?.length !== peopleIFollowFromRelay?.size &&
        localStorage.getItem(Constants.FOLLOWERS_FROM_RELAY) === 'false')
    ) {
      await this.fetchFollowersAndCache(peopleIFollowFromRelay);
    } else {
      this.fetchingPeopleIFollowFromRelay$.next(false);
    }

    return await this.dbService.peopleIFollow.toArray();
  }

  async fetchMutedUsersFromCache(): Promise<User[]> {
    var peopleIMutedFromCache = await this.dbService.mutedPeople.toArray();
    console.log('PeopleIMuted from cache ' + peopleIMutedFromCache?.length);

    var peopleIMutedFromRelay = await this.fetchMuteList(this.currentUser?.pubkey!);

    if (peopleIMutedFromCache?.length === 0 || peopleIMutedFromCache?.length !== peopleIMutedFromRelay?.length) {
      await this.fetchMutedPeopleAndCache(peopleIMutedFromRelay);
    } else {
      this.fetchingMutedUsersFromRelay$.next({ status: false, count: peopleIMutedFromRelay?.length });
    }

    return await this.dbService.mutedPeople.toArray();
  }

  async loadCommunitiesToCache(){
    this.loadingCommunitiesEmitter$.next(true);
    console.log("Loading communities to cache...");
    this.fetchCommunities().then(()=>{
      this.loadingCommunitiesEmitter$.next(false);
      console.log("Cached all communities...")
    })
  }

  async getCommunityDetails(id: string): Promise<Community|undefined> {
    const communityFromCache = await this.communityCache.fetchCommunityWithId(id);
    if(communityFromCache){
      return communityFromCache;
    }
    const splitId = id.split(':');
    //@ts-ignore
    const filter: NDKFilter = { kinds: [34550], '#d': [splitId[2]], authors:[splitId[1]] };
    const events = await this.ndk?.fetchEvents(filter,{});
    if(events && events.size > 0){
      const communityEvent = events.values().next().value
      const name = this.getTagValue('d',communityEvent);
      const description = this.getTagValue('description',communityEvent);
      const rules = this.getTagValue('rules',communityEvent);
      const creatorHexKey = communityEvent.pubkey;
      const image = this.getTagValue('image',communityEvent);
      const moderatorTagArr:NDKTag[] = communityEvent.getMatchingTags('p');
      let moderatorHexKeys:string[] = []
      for(let tag of moderatorTagArr) {
        if(tag[3] && tag[3] === 'moderator'){
          moderatorHexKeys.push(tag[1]);
        }
      };
      if(moderatorHexKeys.indexOf(communityEvent.pubkey)===-1){
        moderatorHexKeys.push(communityEvent.pubkey);
      }
      const communityToReturn =  {
        id: '34550:'+creatorHexKey+':'+name,
        name:name,
        description: description,
        image: image,
        creatorHexKey: creatorHexKey,
        moderatorHexKeys: moderatorHexKeys,
        rules:rules,
      }
      this.communityCache.addCommunity(communityToReturn);
      return communityToReturn;
    }
    return undefined;
  }

  getTagValue(tagName:string, event:NDKEvent){
      const tags = event.getMatchingTags(tagName);
      if(tags && tags.length>0){
        const tag = tags[0]
        if(tag && tag.length > 1){
          return tag[1];
        }
      }
      return undefined;
  }


  async fetchCommunities(limit?: number, since?: number, until?: number, ownedOnly?:boolean, moderatingOnly?: boolean ):Promise<Community[] | undefined>{
    //@ts-ignore
    let filter: NDKFilter = { kinds: [34550],
      limit: limit,
      since:since,
      until:until,
      authors: (ownedOnly? [this.currentUser?.pubkey!] : undefined),
    };
    if(moderatingOnly){
      filter = {...filter, '#p':[this.currentUser?.pubkey!]}
    }
    const events = await this.ndk?.fetchEvents(filter,{});
    let returnValue:Community[] = this.makeCommunitiesFromEvents(events);
    returnValue.forEach((c) => this.communityCache.addCommunity(c));
    return returnValue;
  }

  async fetchFollowersForCommunity(communityLongId: string):Promise<string[]>{
    const filter:NDKFilter = {
      '#a':[communityLongId]
    }
    const events = await this.ndk?.fetchEvents(filter,{});
    if(events){
      const dedupedFollowers = new Set([...events].map((e) => e.pubkey));
      return [...dedupedFollowers]
    }
    return []
  }

  async approveNote(event:NDKEvent, originalEventId:string, originalKind:NDKKind):Promise<NDKEvent>{
    const approvalEvent:NDKEvent = new NDKEvent(this.ndk);
    approvalEvent.kind = 4550;
    approvalEvent.tags = [
      event.getMatchingTags('a')[0],
      ['e', originalEventId],
      ['p', event.pubkey],
      ['k', ''+originalKind]
    ]
    event.id = originalEventId;
    approvalEvent.content = JSON.stringify(await event.toNostrEvent())
    await approvalEvent.publish();
    return approvalEvent;
  }

  private makeCommunitiesFromEvents(events: Set<NDKEvent> | undefined) {
    let returnValue = [];
    if (events) {
      for (let communityEvent of events) {
        try{
          const name = communityEvent.getMatchingTags('d')[0][1];
          let displayName;
          const displayNameTags = communityEvent.getMatchingTags('name');
          if(displayNameTags && displayNameTags.length>0){
            displayName = displayNameTags[0][1]
          }
          const descriptionTag = communityEvent.getMatchingTags('description');
          let description;
          if (descriptionTag && descriptionTag.length > 0) {
            description = descriptionTag[0][1];
          };
          let rules;
          const rulesTag = communityEvent.getMatchingTags('rules');
          if (rulesTag && rulesTag.length > 0) {
            rules = rulesTag[0][1];
          };
          let moderatorHexKeys:string[] = [];
          const moderatorTags = communityEvent.getMatchingTags('p');
          if(moderatorTags && moderatorTags.length > 0){
            moderatorHexKeys = moderatorTags.map((t)=> t[1]);
          }
          const creatorHexKey = communityEvent.pubkey;
          let image;
          const imageTag = communityEvent.getMatchingTags('image');
          if (imageTag && imageTag.length > 0) {
            image = imageTag[0][1];
          }
          returnValue.push({
            id: '34550:' + creatorHexKey + ':' + name,
            displayName: displayName,
            name: name,
            description: description,
            rules: rules,
            image: image,
            creatorHexKey: creatorHexKey,
            moderatorHexKeys: moderatorHexKeys,
            created_at: communityEvent.created_at
          });
        } catch(e){
          console.log(e);
        }        
      }
    }
    return returnValue;
  }

  async fetchJoinedCommunities(){
    if(this.appData.followedCommunities === ''){
      return [];
    }
    const joinedArr = this.appData.followedCommunities.split(',');
    const authors = joinedArr.map((id)=> id.split(':')[1])
    const names = joinedArr.map((id) => id.split(':')[2])
    const filter:NDKFilter = {
      //@ts-ignore
      kinds:[34550],
      authors:authors,
      '#d':names
    }
    const communityEvents = await this.ndk?.fetchEvents(filter,{});
    return this.makeCommunitiesFromEvents(communityEvents);
  }

  async getApprovalEvents(id:string):Promise<Set<NDKEvent>|undefined>{
    const filter:NDKFilter = {
      //@ts-ignore
      kinds:[4550], 
      '#e':[id]
    }
    const approvalEvents = await this.ndk?.fetchEvents(filter,{});
    return approvalEvents;
  }

  async fetchEvents(tag: string, limit?: number, since?: number, until?: number): Promise<Set<NDKEvent> | undefined> {
    const filter: NDKFilter = { kinds: [1], '#t': [tag], limit: limit, since: since, until: until };
    return this.ndk?.fetchEvents(filter,{});
  }

  async fetchEventsFromCommunity(community: Community, limit?: number, since?: number, until?: number):Promise<Set<NDKEvent> | undefined> {
    //@ts-ignore
    const filter: NDKFilter = { kinds: [1,4549], '#a': [community.id!], limit: limit, since: since, until: until };
    return this.ndk?.fetchEvents(filter,{});
  }

  async fetchEventFromId(id: string) {
    if (id.startsWith('note1')) {
      id = LoginUtil.bech32ToHex(id);
    }
    //@ts-ignore
    const filter: NDKFilter = { kinds: [1,4549], ids: [id] };
    return this.ndk?.fetchEvent(filter,{});
  }

  async fetchAllFollowedTopicEvents(
    followedTopics: string[],
    limit?: number,
    since?: number,
    until?: number
  ): Promise<Set<NDKEvent> | undefined> {
    const filter: NDKFilter = { kinds: [1], '#t': followedTopics, limit: limit, since: since, until: until };
    return this.ndk?.fetchEvents(filter);
  }

  async zapRequest(numberOfSats:number, event: NDKEvent): Promise<string | null> {
    return await event.zap(numberOfSats * 1000, '+');
  }

  async fetchAllFollowedCommunityEvents(
    followedCommunities: string[],
    limit?: number,
    since?: number,
    until?: number
  ): Promise<Set<NDKEvent> | undefined> {
    //@ts-ignore
    const filter: NDKFilter = { kinds: [1,  4549], '#a': followedCommunities, limit: limit, since: since, until: until };
    return this.ndk?.fetchEvents(filter);
  }

  async getRelatedEventsOfNote(event: NDKEvent) {
    const filter: NDKFilter = { kinds: [1, 7, 9735], '#e': [event.id] };
    return this.ndk?.fetchEvents(filter);
  }

  async fetchZaps(event: NDKEvent): Promise<Set<NDKEvent> | undefined> {
    const filter: NDKFilter = { kinds: [9735], '#e': [event.id] };
    return this.ndk?.fetchEvents(filter);
  }

  async fetchReactions(event: NDKEvent): Promise<Set<NDKEvent> | undefined> {
    const filter: NDKFilter = { kinds: [7], '#e': [event.id] };
    return this.ndk?.fetchEvents(filter);
  }

  deDuplicate(data:string){
    var deduped = data.split(',');
    return [...new Set(deduped)].join(',')
  }

  async publishAppData(followListCsv?: string, downzapRecipients?: string, mutedTopics?: string, followedCommunitiesCsv?:string) {
    var data = await this.fetchAppData();
    const ndkEvent = new NDKEvent(this.ndk);
    ndkEvent.kind = 30078;

    if (this.currentUser) {
      ndkEvent.pubkey = this.currentUser?.pubkey;
    }
    let followedTopicsToPublish = '';
    if (followListCsv !== undefined) {
      followedTopicsToPublish = this.deDuplicate(followListCsv);
    } else {
      followedTopicsToPublish = this.deDuplicate(data.hashtags.join(','));
    }

    const downzapRecipientsToPublish = this.deDuplicate(downzapRecipients||'') || this.deDuplicate(data.downzapRecipients);

    let mutedTopicsToPublish = '';
    if (mutedTopics !== undefined) {
      mutedTopicsToPublish = this.deDuplicate(mutedTopics);
    } else {
      mutedTopicsToPublish = this.deDuplicate(this.appData.mutedTopics);
    }

    let followedCommunitiesToPublish = '';
    if (followedCommunitiesCsv !== undefined) {
      followedCommunitiesToPublish = this.deDuplicate(followedCommunitiesCsv);
    } else {
      followedCommunitiesToPublish = this.deDuplicate(data.communities.join(','));
    }

    ndkEvent.content = followedTopicsToPublish + '\n' + downzapRecipientsToPublish + '\n' + mutedTopicsToPublish + '\n' + followedCommunitiesToPublish;
    const tag: NDKTag = ['d', 'zapddit.com'];
    ndkEvent.tags = [tag];
    if (this.canWriteToNostr) {
      ndkEvent.publish(); // This will trigger the extension to ask the user to confirm signing.
    }
    await this.refreshAppData();
  }

  async followUnfollowContact(hexPubKeyToFollow: string, follow: boolean){
    const contactListFilter:NDKFilter ={
      kinds:[3],
      authors:[this.currentUser?.pubkey!]
    }
    const contactListEvents = await this.ndk?.fetchEvents(contactListFilter,{})
    if(contactListEvents && contactListEvents.size > 0){
      const contactListEvent = [...contactListEvents][0];
      const contactListRawEvent = await contactListEvent.toNostrEvent();
      var tagsForNewEvent = contactListRawEvent.tags;
      if(follow){
        //add a p tag
        tagsForNewEvent.push(['p',hexPubKeyToFollow]);
      } else {
        tagsForNewEvent = tagsForNewEvent.filter((t) => t[1] !== hexPubKeyToFollow);
      }

      const eventToSend = this.createNDKEvent();
      eventToSend.kind = 3;
      eventToSend.tags = tagsForNewEvent;
      console.log(eventToSend);
      if(this.canWriteToNostr){
        return eventToSend.publish();
      }
    } else {
      const eventToSend = this.createNDKEvent();
      eventToSend.kind = 3;
      if(follow){
        eventToSend.tags = [['p',hexPubKeyToFollow]];
        console.log(eventToSend);
        if(this.canWriteToNostr){
          return eventToSend.publish();
        }
      }
    }
    return null;
  }

  fetchLatestAppData() {
    let authors: string[] = [];
    if (this.currentUser?.pubkey) {
      authors = [this.currentUser.pubkey];
    }
    const filter: NDKFilter = { kinds: [30078], '#d': ['zappedit.com', 'zapddit.com'], limit: 1, authors: authors };
    return this.ndk?.fetchEvents(filter);
  }

  async fetchLatestDataFromInteroperableList(){
    const filter: NDKFilter = { kinds: [30001], '#d': ["communities", "hashtags", "downzaprecipients"], authors:[this.currentUser?.pubkey!] };
    const events = await this.ndk?.fetchEvents(filter,{});
    let hashtags:string[] = []
    let mutedhashtags:string[] = []
    let communities:string[] = []
    let downzapRecipients:string[] = []

    const data = {hashtags:hashtags,communities:communities,mutehashtags:mutedhashtags, downzapRecipients:downzapRecipients}

    if(events && events.size > 0){
      for(var communityEvent of events.values()){
        const name = communityEvent.getMatchingTags('d')[0][1];

        if(name && name === "hashtags"){
          const joinedHashtagsTagArr:NDKTag[] = communityEvent.getMatchingTags('t');
          for(let tag of joinedHashtagsTagArr) {
            if(tag[1]){
              hashtags.push(tag[1]);
            }
          };

          data.hashtags = [...new Set(hashtags)];
        }

        if(name && name === "communities"){
          const joinedCommunitiesTagArr:NDKTag[] = communityEvent.getMatchingTags('a');

          for(let tag of joinedCommunitiesTagArr) {
            if(tag[1]){
              communities.push(tag[1]);
            }
          };

          data.communities = [...new Set(communities)];
        }

        if(name && name === "downzaprecipients"){
          const downzapRecipientsTags:NDKTag[] = communityEvent.getMatchingTags('p');

          for(let tag of downzapRecipientsTags) {
            if(tag[1]){
              downzapRecipients.push((await this.getNdkUserFromHex(tag[1]))?.npub!);
            }
          };

          data.downzapRecipients = [...new Set(downzapRecipients)];
        }
      }
    }
    return data;
  }

  async fetchAppData() {
    const latestEvents: Set<NDKEvent> | undefined = await this.fetchLatestAppData();
    var communities:string[] = [];
    var topics:string[] = [];
    var downzapRecipients:string='';
    var mutedTopics = '';
    if (latestEvents && latestEvents.size > 0) {
      const latestEvent: NDKEvent = Array.from(latestEvents)[0];
      const multiLineAppData = latestEvent.content;
      const lineWiseAppData = multiLineAppData.split('\n');
      for (let i = 0; i < lineWiseAppData.length; i++) {
        switch (i) {
          case 0:
            topics.push(...lineWiseAppData[i].split(','));
            break;
          case 1:
            downzapRecipients=lineWiseAppData[i];
            break;
          case 2:
            mutedTopics = lineWiseAppData[i];
            break;
          case 3:
            if(lineWiseAppData[i] !== ''){
              communities.push(...lineWiseAppData[i].split(','));
            }
            break;
          default:
          //do nothing. irrelevant data
        }
      }
    }

    return {hashtags:topics,downzapRecipients:downzapRecipients, communities:communities, mutedHashtags:mutedTopics};
  }


  async refreshAppData() {
    console.log("refreshing app data...")
    let hashtags:string[] = []
    let mutedhashtags:string[] = []
    let initCommunities:string[] = []
    let downzapRecipients:string[] = []
    var dataFromInteroperableList = {hashtags:hashtags,communities:mutedhashtags,mutehashtags:initCommunities, downzapRecipients:downzapRecipients}

    if(!this.isTryingZapddit)
       dataFromInteroperableList = await this.fetchLatestDataFromInteroperableList();

    const latestEvents: Set<NDKEvent> | undefined = await this.fetchLatestAppData();
    var communities:string[] = [];
    var topics:string[] = [];

    if (latestEvents && latestEvents.size > 0) {
      const latestEvent: NDKEvent = Array.from(latestEvents)[0];
      const multiLineAppData = latestEvent.content;
      const lineWiseAppData = multiLineAppData.split('\n');
      for (let i = 0; i < lineWiseAppData.length; i++) {
        switch (i) {
          case 0:
            topics.push(...lineWiseAppData[i].split(','));
            break;
          case 1:
            this.appData.downzapRecipients = lineWiseAppData[i];
            break;
          case 2:
            this.appData.mutedTopics = lineWiseAppData[i];
            this.mutedTopicsEmitter.emit(this.appData.mutedTopics);
            break;
          case 3:
            if(lineWiseAppData[i] !== ''){
              communities.push(...lineWiseAppData[i].split(','));
            }
            break;
          default:
          //do nothing. irrelevant data
        }
      }

      topics.push(...dataFromInteroperableList.hashtags);
      this.appData.followedTopics = [...new Set(topics.filter(i=>i!=''))].join(',');
      console.log("from merged source topics- "+ this.appData.followedTopics);
      this.followedTopicsEmitter.emit(this.appData.followedTopics);

      this.appData.downzapRecipients = dataFromInteroperableList.downzapRecipients.join(',')
      console.log("downzaprecipients - "+dataFromInteroperableList.downzapRecipients.join(','))

      communities.push(...dataFromInteroperableList.communities);
      this.appData.followedCommunities = [...new Set(communities)].join(',');
      console.log("from merged source communities - "+this.appData.followedCommunities)
      this.followedCommunitiesEmitter.emit(this.appData.followedCommunities);

      console.log('Latest follow list :' + this.appData.followedTopics);
      localStorage.setItem(Constants.FOLLOWEDTOPICS, this.appData.followedTopics);

      console.log('Latest downzap recipients:' + this.appData.downzapRecipients);
      localStorage.setItem(Constants.DOWNZAPRECIPIENTS, this.appData.downzapRecipients);

      console.log('Latest muted topics:' + this.appData.mutedTopics);
      localStorage.setItem(Constants.MUTEDTOPICS, this.appData.mutedTopics);

      console.log('Latest follow communities:' + this.appData.followedCommunities);
      localStorage.setItem(Constants.FOLLOWEDCOMMUNITIES,this.appData.followedCommunities);

      const satsFromLocalStorage = localStorage.getItem(Constants.DEFAULTSATSFORZAPS);
      if (satsFromLocalStorage) {
        try {
          const numberSats = Number.parseInt(satsFromLocalStorage);
          this.defaultSatsForZaps = numberSats;
        } catch (e) {
          console.error(e);
        }
      }
    }

    this.appDataEmitter.emit(true);

    console.log("app data refreshed");
  }

  setDefaultSatsForZaps(sats: number) {
    this.defaultSatsForZaps = sats;
    localStorage.setItem(Constants.DEFAULTSATSFORZAPS, '' + sats);
  }

  logout() {
    localStorage.clear();
    this.dbService.delete();
    window.location.href = '/';
  }

  /*
  Below methods are a stop-gap copy from NDK source to support zapping non-author
  */
  async downZapRequest(numberOfSats:number,
    zappedEvent: NDKEvent,
    zapRecipient: NDKUser | undefined,
    comment?: string,
    extraTags?: NDKTag[]
  ) {
    if (zapRecipient) {
      const zapEndpoint = await this.getZapEndpointForUser(zapRecipient);

      if (!zapEndpoint) {
        throw new Error('No zap endpoint found');
      }

      const zapRequest = nip57.makeZapRequest({
        profile: zapRecipient.pubkey,

        // set the event to null since nostr-tools doesn't support nip-33 zaps
        event: null,
        amount: numberOfSats * 1000,
        comment: comment || '',
        relays: explicitRelayUrls,
      });

      // add the event tag if it exists; this supports both 'e' and 'a' tags
      if (zappedEvent) {
        const tag = zappedEvent.tagReference();
        if (tag) {
          zapRequest.tags.push(tag);
        }
      }

      zapRequest.tags.push(['lnurl', zapEndpoint]);

      const zapRequestEvent = new NDKEvent(this.ndk, zapRequest as NostrEvent);
      if (extraTags) {
        zapRequestEvent.tags = zapRequestEvent.tags.concat(extraTags);
      }

      await zapRequestEvent.sign();
      const zapRequestNostrEvent = await zapRequestEvent.toNostrEvent();

      const response = await fetch(
        `${zapEndpoint}?` +
          new URLSearchParams({
            amount: (numberOfSats * 1000).toString(),
            nostr: JSON.stringify(zapRequestNostrEvent),
          })
      );
      const body = await response.json();
      return body.pr;
    } else {
      this.zapRequest(numberOfSats, zappedEvent);
    }
  }

  async getZapEndpointForUser(zapRecipient: NDKUser): Promise<string | undefined> {
    let lud06: string | undefined;
    let lud16: string | undefined;
    let zapEndpoint: string | undefined;
    let zapEndpointCallback: string | undefined;

    if (zapRecipient) {
      // check if user has a profile, otherwise request it
      if (!zapRecipient.profile || !(zapRecipient.profile.lud06 || zapRecipient.profile.lud16)) {
        await zapRecipient.fetchProfile();
        this.objectCache.addUser(zapRecipient);
      }

      lud06 = (zapRecipient.profile || {}).lud06;
      lud16 = (zapRecipient.profile || {}).lud16;
    }

    if (lud16) {
      const [name, domain] = lud16.split('@');
      zapEndpoint = `https://${domain}/.well-known/lnurlp/${name}`;
    } else if (lud06) {
      const { words } = bech32.decode(lud06, 1000);
      const data = bech32.fromWords(words);
      const utf8Decoder = new TextDecoder('utf-8');
      zapEndpoint = utf8Decoder.decode(data);
    }

    if (!zapEndpoint) {
      throw new Error('No zap endpoint found');
    }

    const response = await fetch(zapEndpoint);
    const body = await response.json();

    if (body?.allowsNostr && (body?.nostrPubkey || body?.nostrPubKey)) {
      zapEndpointCallback = body.callback;
    }

    return zapEndpointCallback;
  }

  async checkIfNIP05Verified(nip05: string | undefined, hexPubKey: string | undefined): Promise<boolean> {
    var nip05Domain;
    var verificationEndpoint;
    var nip05Name;
    var verified: boolean = false;
    try{
      if (nip05) {
        var elements = nip05.split('@');
        nip05Domain = elements.pop();
        nip05Name = elements.pop();
        verificationEndpoint = `https://${nip05Domain}/.well-known/nostr.json?name=${nip05Name}`;

        var response = await fetch(`${verificationEndpoint}`);
        const body = await response.json();

        if (body['names'] && body['names'][`${nip05Name}`]) {
          var hexPubKeyFromRemote = body['names'][`${nip05Name}`];

          if (hexPubKey === hexPubKeyFromRemote) {
            verified = true;
            // raise this only for the current logged in user
            if (hexPubKey === this.currentUser?.pubkey)
              this.isNip05Verified$.next(true);
          }
        }
      }
    } catch(e){
      console.error(e);
    }
    return verified;
  }

  async saveMetadataAndFetchUserProfile(user: any, pictureUrl: string) {
    const newProfileEvent: NDKEvent = new NDKEvent(this.ndk);
    newProfileEvent.kind = 0;
    newProfileEvent.pubkey = this.currentUser?.pubkey!;
    let currentProfile = user;
    let currentProfileCopy = {};

    if (pictureUrl) {
      currentProfileCopy = {
        ...currentProfile,
        name: user.name,
        displayName: user.displayName,
        display_name: user.displayName,
        nip05: user.nip05,
        about: user.about,
        bio: user.bio,
        image: pictureUrl,
      };
    } else {
      currentProfileCopy = {
        ...currentProfile,
        name: user.name,
        displayName: user.displayName,
        display_name: user.displayName,
        nip05: user.nip05,
        about: user.about,
        bio: user.bio,
      };
    }
    newProfileEvent.content = JSON.stringify(currentProfileCopy!);
    await newProfileEvent.sign();
    await newProfileEvent.publish();
  }

  async publishReactionToEvent(event: NDKEvent, reaction: string) {
    const tags: NDKTag[] = [
      ['e', event.id],
      ['p', event.pubkey],
    ];
    const reactionEvent = new NDKEvent(this.ndk);
    reactionEvent.kind = NDKKind.Reaction;
    reactionEvent.content = reaction;
    reactionEvent.tags = tags;
    reactionEvent.publish();
  }

  async fetchRelayEvent(hexPubKey: string): Promise<NDKEvent | null | undefined> {
    let relayEvent: NDKEvent |null|undefined;
    // nip 65 specifies a kind 10002 event to broadcast a user's subscribed relays
    const filter: NDKFilter = { kinds: [10002], authors: [hexPubKey] };
    console.log("trying to get user 10002 events")
    const relayEvents = (await this.ndk?.fetchEvents(filter,{}));
    if(relayEvents){
      const sortedRelayEvents = [...relayEvents].sort((a:NDKEvent,b:NDKEvent)=> b.created_at!-a.created_at!)
      relayEvent = sortedRelayEvents[0]; //take the latest event
      if (!relayEvent){ // failover to the damus/snort relay event
        // some clients use kind 3 (contacts) events to broadcast a user's subscribed relays
        const filter2: NDKFilter = { kinds: [3], authors: [hexPubKey] };
        console.log("trying to get user 3 events");
        relayEvent = await this.ndk?.fetchEvent(filter2,{});
      }
    }

    return relayEvent;
  }

  processRelayContent(relay: [string, unknown]): Relay {
    let read: boolean = true;
    let write: boolean = true;

    const relayUrl: string = relay[0];
    const relayName: string = relayUrl.replace('wss://', '').replace('/', '');
    const settings = Object.entries(relay[1] as Object);

    if (settings[0][0] == 'read') read = settings[0][1];
    else if (settings[1][0] == 'read') read = settings[1][1];
    if (settings[0][0] == 'write') write = settings[0][1];
    else if (settings[1][0] == 'write') write = settings[1][1];

    return new Relay(relayName, relayUrl, read, write);
  }

  parseRelayEventContent(content: string): Relay[] {
    let relays: Relay[] = [];
    const relayJSON = JSON.parse(content);
    const rel = Object.entries(relayJSON);
    rel.forEach(relay => {
      const item: Relay = this.processRelayContent(relay);
      relays.push(item);
    })
    return relays;
  }

  processRelayTag(tag: NDKTag): Relay {
    let read: boolean = true;
    let write: boolean = true;

    const relayUrl: string = tag[1];
    const relayName: string = relayUrl.replace('wss://', '').replace('/', '');
    if (tag[2]) {
      if(tag[2] === 'read') write = false;
      else if (tag[2] === 'write') read = false;
    }

    return new Relay(relayName, relayUrl, read, write);
  }

  parseRelayEventTags(tags: NDKTag[]): Relay[] {
    let relays: Relay[] = [];
    // console.log(tags);
    tags.forEach(tag => {
      if(tag[0] === 'r'){
        const item: Relay = this.processRelayTag(tag);
        relays.push(item);
      }
    })
    return relays;
  }

  async getUserSubscribedRelays(): Promise<Relay[]> {
    try{
      let relays: Relay[] = [];
      let author: string = '';
      if (this.currentUser?.pubkey) {
        author = this.currentUser.pubkey;
      }
      const relayListFromNdk =  await this.ndk?.activeUser?.relayList();
      const relayEntriesFromNdk = relayListFromNdk?.relays;
      if(relayEntriesFromNdk){
        for (let i = 0; i<relayEntriesFromNdk.length; i++){
          relays.push(new Relay(relayEntriesFromNdk[i],relayEntriesFromNdk[i]))
        }
      }      
      return relays;
    }
    catch(e){
      console.log("Error in fetching relay list from relay"); 
      return [];
    }
    
  }

  async addRelayToDB(table: Table<Relay>, relay: Relay) {
    await table
      .where('name')
      .equalsIgnoreCase(relay.name)
      .count()
      .then(async count => {
        if (count == 0) {
          await table.add(relay, relay.name);
          console.log(`relay added to ${table.name}`);
        } else {
          console.log('Relay already exists');
        }
      })
      .catch(e => console.error(`db call - ${e}`));
  }

  async fetchSubscribedRelaysAndCache(relaysFromRelay: Relay[]) {
    if (relaysFromRelay) {
      this.dbService.subscribedRelays.clear();
      console.log('Subbed relay db cleared');

      for(let relay of relaysFromRelay){
        await this.addRelayToDB(this.dbService.subscribedRelays, relay);
      }

    }
  }

  async fetchSubscribedRelaysFromCache(): Promise<Relay[]> {
    try{
      var subscribedRelaysFromCache = await this.dbService.subscribedRelays.toArray();
      console.log(`Subscribed Relays from cache : ${subscribedRelaysFromCache?.length}`);
  
      const subscribedRelaysFromRelay: Relay[] = await this.getUserSubscribedRelays();
      console.log("Got user subscribed relays")
      if (
        subscribedRelaysFromCache?.length === 0 ||
        subscribedRelaysFromCache?.length !== subscribedRelaysFromRelay?.length
      ) {
        await this.fetchSubscribedRelaysAndCache(subscribedRelaysFromRelay);
      }
      console.log("returning subscribed relays from cache")
    } catch(e){
      console.log("Error in fetching relays.."+ e)
    }
    
    return await this.dbService.subscribedRelays.toArray();
  }

  buildDownzapRecipientEvent(existing:string[]): NDKEvent {
    var event = this.createNDKEvent();
    let tags: NDKTag[] = [];
    tags.push(['d', 'downzaprecipients']);

    for(let item of existing){
      console.log('push p tag -'+item)
      if(item)
        tags.push(['p',`${item}`])
    }

    event.tags = tags;
    event.kind = 30001;
    return event;
  }

  async buildAndPublishDownzapRecipient(existing:string[]){
    var event = this.buildDownzapRecipientEvent(existing);
    await event.sign();
    await event.publish();
    this.appData.downzapRecipients = existing[0]
  }


}


