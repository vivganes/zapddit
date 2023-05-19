import { EventEmitter, Injectable } from '@angular/core';
import NDK, {
  type NDKConstructorParams,
  NDKNip07Signer,
  NDKUser,
  type NDKUserProfile,
  NDKFilter,
  NDKEvent,
  zapInvoiceFromEvent,
  NDKZapInvoice,
  NostrEvent,
  NDKTag,
  NDKSubscription,
  NDKSigner,
  NDKPrivateKeySigner,
} from '@nostr-dev-kit/ndk';
import { nip57 } from 'nostr-tools';
import { bech32 } from '@scure/base';
import { LoginUtil } from '../util/LoginUtil';
import { ZappeditdbService } from './zappeditdb.service';
import { NDKUserProfileWithNpub } from '../model/NDKUserProfileWithNpub';
import { User } from '../model/user';

interface ZappedItAppData {
  followedTopics: string;
  downzapRecipients: string;
  mutedTopics:string;
}

const explicitRelayUrls = ['wss://nos.lol',
'wss://relay.nostr.band',
'wss://relay.f7z.io',
'wss://relay.damus.io',
'wss://nostr.mom',
'wss://no.str.cr',]; //TODO: fix this

@Injectable({
  providedIn: 'root',
})
export class NdkproviderService {
 
  ndk: NDK | undefined;
  currentUserProfile: NDKUserProfile | undefined;
  currentUser: NDKUser | undefined;
  currentUserNpub: string|undefined;
  appData: ZappedItAppData = {
    followedTopics: '',
    downzapRecipients: '',
    mutedTopics:'',
  };

  defaultSatsForZaps:number = 1
  loggedIn: boolean = false;
  loggingIn: boolean = false;
  loginError:string|undefined;
  followedTopicsEmitter:EventEmitter<string> = new EventEmitter<string>()
  private signer:NDKSigner|undefined = undefined;
  isNip07 = false;
  mutedTopicsEmitter: EventEmitter<string> = new EventEmitter<string>();

  constructor(private dbService:ZappeditdbService){
    const npubFromLocal = localStorage.getItem('npub');
    const privateKey = localStorage.getItem('privateKey');
    if(npubFromLocal && npubFromLocal !== ''){
      // we can login as the login has already happened
      if(privateKey && privateKey !== ''){
        this.isNip07 = false;
        this.signer = new NDKPrivateKeySigner(privateKey);
        this.tryLoginUsingNpub(npubFromLocal);
      } else {
        //this.signer = new NDKNip07Signer();
        //dont assign a signer now. we need to assign it later only
        this.isNip07 = true;
        this.tryLoginUsingNpub(npubFromLocal);
      }

    }
  }

  attemptLoginUsingPrivateKey(privateKey: string){
    try{
      this.loggingIn = true;
      this.loginError = undefined;
      const hexPrivateKey = this.validateAndGetHexPrivateKey(privateKey);
      this.signer = new NDKPrivateKeySigner(hexPrivateKey);
      this.signer.user().then((user) => {
        localStorage.setItem('privateKey', hexPrivateKey)
        localStorage.setItem('npub', user.npub)
        this.tryLoginUsingNpub(user.npub);
      })
    }catch(e:any){
      console.error(e);
      this.loginError = e.message;
      this.loggingIn = false;
    }
  }

  validateAndGetHexPrivateKey(privateKey:string):string{
    if(!privateKey || privateKey === '' || privateKey == null){
      throw new Error('Private key is required')
    }
    return LoginUtil.getHexFromPrivateKey(privateKey);
  }

  async tryLoginUsingNpub(npubFromLocal: string){
    this.loggingIn = true;
    this.loginError = undefined;
    if(this.isNip07){
      while (!window.hasOwnProperty('nostr')) {
        // define the condition as you like
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      console.log("Found window nostr")
      this.signer = new NDKNip07Signer();
    }

    const params: NDKConstructorParams = { signer: this.signer, explicitRelayUrls: explicitRelayUrls };
    this.ndk = new NDK(params);

    await this.ndk.connect(1000);
    this.initializeUsingNpub(npubFromLocal)
  }

  attemptLoginWithNip07() {
    this.loggingIn = true;
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
    const user = this.ndk?.getUser({ npub });
    await user?.fetchProfile();
    return user?.profile;
  }

  async fetchFollowersFromNpub(npub: string):Promise<Set<NDKUser> | undefined>{
    const user = this.ndk?.getUser({ npub });
    const ndkUsers = await user?.follows();
    return ndkUsers;
  }

  async getNdkUserFromNpub(npub: string): Promise<NDKUser | undefined> {
    try {
      const user = this.ndk?.getUser({ npub });
      await user?.fetchProfile();
      return user;
    } catch (e) {
      console.log(e);
      return undefined;
    }
  }

  async getProfileFromHex(hexpubkey: string): Promise<NDKUserProfile | undefined> {
    const user = this.ndk?.getUser({ hexpubkey });
    await user?.fetchProfile();
    return user?.profile;
  }

  async getNdkUserFromHex(hexpubkey: string): Promise<NDKUser | undefined> {
    const user = this.ndk?.getUser({ hexpubkey });
    await user?.fetchProfile();
    return user;
  }

  private async initializeClientWithSigner() {
    try {
        this.signer?.user().then(async user => {
        const params: NDKConstructorParams = { signer: this.signer, explicitRelayUrls: explicitRelayUrls };
        this.ndk = new NDK(params);
        await this.ndk.assertSigner();
        await this.ndk.connect(1000);
        if (user.npub) {
          console.log('Permission granted to read their public key:', user.npub);
          localStorage.setItem('npub',user.npub);
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
    const relays = this.currentUser?.relayUrls;
    if (relays && relays.length > 0) {
      const newNDKParams = { signer: this.signer, explicitRelayUrls: relays };
      const newNDK = new NDK(newNDKParams);
      if(this.isNip07){
        await newNDK.assertSigner();
      }
      try {
        await newNDK.connect().catch(e => console.log(e));
        this.ndk = newNDK;
      } catch (e) {
        console.log("Error in connecting NDK " + e);
      }
    }
    await this.refreshAppData();
    this.loggingIn = false;
    //once all setup is done, then only set loggedIn=true to start rendering
    this.loggedIn = true;
  }

  isLoggedIn(): boolean {
    return this.loggedIn;
  }

  getCurrentUserProfile(): NDKUserProfile | undefined {
    return this.currentUserProfile;
  }

  async fetchFollowersForCurrentLoggedInUser():Promise<Set<NDKUser> | undefined>{
    try{
      if(this.currentUser){
        return this.fetchFollowersFromNpub(this.currentUser.npub)
      }
    } catch(e){
      console.log(e);
    }
      return new Set<NDKUser>;
  }

  private async fetchFollowersUserProfile(){
    const ndkUsers = (await this.fetchFollowersForCurrentLoggedInUser());
    let ndkUsersArray : NDKUser[] = [];

    if(ndkUsers?.values && ndkUsers?.size > 0){
      ndkUsersArray = Array.from(ndkUsers);
    }

    return ndkUsersArray.map(async item =>
      {
        return await this.getProfileFromNpub(item.npub);
      });
  }

  async fetchFollowers(){
    let followerUserProfilesPromise = await this.fetchFollowersUserProfile();
    return Promise.all(followerUserProfilesPromise);
  }

  async fetchFollowersAndCache(){
    this.fetchFollowers().then((userProfiles) =>{
      userProfiles.forEach(item =>{
            NDKUser.fromNip05(item?.nip05!).then(async user =>{
                const itemWithNpub:NDKUserProfileWithNpub = {
                  profile:item!, npub:user?.npub!, hexPubKey: user?.hexpubkey()!
                }
                await this.addToDb(itemWithNpub);
              })
      })
    })
  }

  async fetchFollowersFromCache(): Promise<User[]>{
    var usersFromCache = await this.dbService.peopleIFollow.toArray();
    if(usersFromCache && usersFromCache.length === 0){
      await this.fetchFollowersAndCache();
    }

    return await this.dbService.peopleIFollow.toArray();
  }

  async addToDb(item: NDKUserProfileWithNpub){
    this.dbService.peopleIFollow.add({
      hexPubKey:item.hexPubKey,
      name: item.profile?.name!,
      displayName: item.profile?.displayName!,
      nip05: item.profile?.nip05!,
      npub: item.npub,
      pictureUrl: item.profile?.image!,
      about:item.profile?.about!
    }, item.npub)
  }

  async fetchEvents(tag: string, limit?: number, since?: number, until?: number): Promise<Set<NDKEvent> | undefined> {
    const filter: NDKFilter = { kinds: [1], '#t': [tag], limit: limit, since: since, until: until };
    return this.ndk?.fetchEvents(filter);
  }

  async fetchAllFollowedEvents(
    followedTopics: string[],
    limit?: number,
    since?: number,
    until?: number
  ): Promise<Set<NDKEvent> | undefined> {
    const filter: NDKFilter = { kinds: [1], '#t': followedTopics, limit: limit, since: since, until: until };
    return this.ndk?.fetchEvents(filter);
  }

  async zapRequest(event: NDKEvent):Promise<string|null> {
    return await event.zap(this.defaultSatsForZaps*1000, '+');
  }

  async fetchZaps(event: NDKEvent): Promise<Set<NDKEvent> | undefined> {
    const filter: NDKFilter = { kinds: [9735], '#e': [event.id] };
    return this.ndk?.fetchEvents(filter);
  }

  async  muteTopic(topic: string) {
    throw new Error('Method not implemented.');
  }

  publishAppData(followListCsv?: string, downzapRecipients?: string, mutedTopics? : string) {
    const ndkEvent = new NDKEvent(this.ndk);
    ndkEvent.kind = 30078;
    if(this.currentUser){
      ndkEvent.pubkey = this.currentUser?.hexpubkey()
    }
    let followedTopicsToPublish = '';
    if(followListCsv !== undefined){
      followedTopicsToPublish = followListCsv;
    } else {
      followedTopicsToPublish = this.appData.followedTopics;
    }

    
    const downzapRecipientsToPublish = (downzapRecipients || this.appData.downzapRecipients)
    let mutedTopicsToPublish = '';
    if(mutedTopics !== undefined){
      mutedTopicsToPublish = mutedTopics
    } else {
      mutedTopicsToPublish = this.appData.mutedTopics;
    }
    
    ndkEvent.content = followedTopicsToPublish + '\n' + downzapRecipientsToPublish +"\n"+ mutedTopicsToPublish;
    const tag: NDKTag = ['d', 'zappedit.com'];
    ndkEvent.tags = [tag];
    ndkEvent.publish(); // This will trigger the extension to ask the user to confirm signing.
    this.appData = {
      followedTopics:followedTopicsToPublish,
      downzapRecipients:downzapRecipientsToPublish,
      mutedTopics: mutedTopicsToPublish
    }
    this.followedTopicsEmitter.emit(followedTopicsToPublish);
  }

  fetchLatestAppData() {
    let authors: string[] = [];
    if (this.currentUser?.hexpubkey()) {
      authors = [this.currentUser.hexpubkey()];
    }
    const filter: NDKFilter = { kinds: [30078], '#d': ['zappedit.com'], limit: 1, authors: authors };
    return this.ndk?.fetchEvents(filter);
  }

  async refreshAppData() {
    const latestEvents: Set<NDKEvent> | undefined = await this.fetchLatestAppData();
    if (latestEvents && latestEvents.size > 0) {
      const latestEvent: NDKEvent = Array.from(latestEvents)[0];
      const multiLineAppData = latestEvent.content;
      const lineWiseAppData = multiLineAppData.split('\n');
      for (let i = 0; i < lineWiseAppData.length; i++) {
        switch (i) {
          case 0:
            this.appData.followedTopics = lineWiseAppData[i];
            this.followedTopicsEmitter.emit(this.appData.followedTopics);
            break;
          case 1:
            this.appData.downzapRecipients = lineWiseAppData[i];
            break;
          case 2:
            this.appData.mutedTopics = lineWiseAppData[i];
            this.mutedTopicsEmitter.emit(this.appData.mutedTopics);
            break;
          default:
          //do nothing. irrelevant data
        }
      }
      console.log('Latest follow list :' + this.appData.followedTopics);
      localStorage.setItem('followedTopics', this.appData.followedTopics);

      console.log('Latest downzap recipients:' + this.appData.downzapRecipients);
      localStorage.setItem('downzapRecipients', this.appData.downzapRecipients);

      console.log('Latest muted topics:' + this.appData.mutedTopics);
      localStorage.setItem('mutedTopics', this.appData.mutedTopics);
      

      const satsFromLocalStorage = localStorage.getItem('defaultSatsForZaps');
      if(satsFromLocalStorage){
        try{
        const numberSats = Number.parseInt(satsFromLocalStorage);
        this.defaultSatsForZaps = numberSats;
        }catch(e){
          console.error(e);
        }
      }
    }
  }

  setDefaultSatsForZaps(sats:number){
    this.defaultSatsForZaps = sats;
    localStorage.setItem('defaultSatsForZaps', ""+sats)
  }

  logout(){
    localStorage.clear();
    window.location.href="/";
  }


  /*
  Below methods are a stop-gap copy from NDK source to support zapping non-author
  */
  async downZapRequest(
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
        profile: zapRecipient.hexpubkey(),

        // set the event to null since nostr-tools doesn't support nip-33 zaps
        event: null,
        amount: this.defaultSatsForZaps*1000,
        comment: comment || '',
        relays: [
          'wss://nos.lol',
          'wss://relay.nostr.band',
          'wss://relay.f7z.io',
          'wss://relay.damus.io',
          'wss://nostr.mom',
          'wss://no.str.cr',
        ], // TODO: fix this
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
            amount: (this.defaultSatsForZaps*1000).toString(),
            nostr: JSON.stringify(zapRequestNostrEvent),
          })
      );
      const body = await response.json();
      return body.pr;
    } else {
      this.zapRequest(zappedEvent);
    }
  }

  async getZapEndpointForUser(zapRecipient: NDKUser): Promise<string | undefined> {
    let lud06: string | undefined;
    let lud16: string | undefined;
    let zapEndpoint: string | undefined;
    let zapEndpointCallback: string | undefined;

    if (zapRecipient) {
      // check if user has a profile, otherwise request it
      if (!zapRecipient.profile) {
        await zapRecipient.fetchProfile();
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
}
