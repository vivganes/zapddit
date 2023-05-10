import { Injectable } from '@angular/core';
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
} from '@nostr-dev-kit/ndk';
import { nip57 } from 'nostr-tools';
import { bech32 } from '@scure/base';

interface ZappedItAppData {
  followedTopics: string;
  downzapRecipients: string;
}

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
  };
  defaultSatsForZaps:number = 1
  loggedIn: boolean = false;

  constructor() {
    this.attemptLogin();
  }

  attemptLogin() {
    if (localStorage.getItem('nip07ExtensionExists') === 'true') {
      try {
        this.initializeClientWithSigner(new NDKNip07Signer());
      } catch (err) {
        this.resolveNip07Extension();
      }
    } else {
      this.resolveNip07Extension();
    }
  }

  private resolveNip07Extension() {
    (async () => {
      localStorage.removeItem('nip07ExtensionExists');
      console.log('waiting for window.nostr');
      while (!window.hasOwnProperty('nostr')) {
        // define the condition as you like
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // do this after window.nostr is available
      this.initializeClientWithSigner(new NDKNip07Signer());
      localStorage.setItem('nip07ExtensionExists', 'true');
    })();
  }

  async getProfileFromNpub(npub: string): Promise<NDKUserProfile | undefined> {
    const user = this.ndk?.getUser({ npub });
    await user?.fetchProfile();
    return user?.profile;
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

  private async initializeClientWithSigner(nip07signer: NDKNip07Signer) {
    try {
      nip07signer.user().then(async user => {
        const params: NDKConstructorParams = { signer: nip07signer, explicitRelayUrls: ['wss://nos.lol',
        'wss://relay.nostr.band',
        'wss://relay.f7z.io',
        'wss://relay.damus.io',
        'wss://nostr.mom',
        'wss://no.str.cr',] }; //TODO: fix this
        this.ndk = new NDK(params);
        await this.ndk.connect(1000);
        if (user.npub) {
          console.log('Permission granted to read their public key:', user.npub);
          this.currentUserNpub = user.npub;
          this.currentUserProfile = await this.getProfileFromNpub(user.npub);
          this.currentUser = await this.getNdkUserFromNpub(user.npub);
          const relays = this.currentUser?.relayUrls;
          if(relays && relays.length>0){
            const newNDKParams= { signer: nip07signer, explicitRelayUrls: relays };
            const newNDK = new NDK(newNDKParams);
            await newNDK.connect();
            this.ndk = newNDK;
          }
          await this.refreshAppData();
          //once all setup is done, then only set loggedIn=true to start rendering
          this.loggedIn = true;
        } else {
          console.log('Permission not granted');
        }
      });
    } catch (err) {
      console.log(err);
    }
  }

  isLoggedIn(): boolean {
    return this.loggedIn;
  }

  getCurrentUserProfile(): NDKUserProfile | undefined {
    return this.currentUserProfile;
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

  publishAppData(followListCsv?: string, downzapRecipients?: string) {
    const ndkEvent = new NDKEvent(this.ndk);
    ndkEvent.kind = 30078;
    if(this.currentUser){
      ndkEvent.pubkey = this.currentUser?.hexpubkey()
    }
    ndkEvent.content =
      (followListCsv || this.appData.followedTopics) + '\n' + (downzapRecipients || this.appData.downzapRecipients);
    const tag: NDKTag = ['d', 'zappedit.com'];
    ndkEvent.tags = [tag];
    ndkEvent.publish(); // This will trigger the extension to ask the user to confirm signing.
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
            break;
          case 1:
            this.appData.downzapRecipients = lineWiseAppData[i];
            break;
          default:
          //do nothing. irrelevant data
        }
      }
      console.log('Latest follow list :' + this.appData.followedTopics);
      localStorage.setItem('followedTopics', this.appData.followedTopics);

      console.log('Latest downzap recipients:' + this.appData.downzapRecipients);
      localStorage.setItem('downzapRecipients', this.appData.downzapRecipients);

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
