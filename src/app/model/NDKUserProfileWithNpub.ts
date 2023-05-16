import { NDKUserProfile } from '@nostr-dev-kit/ndk';

export type NDKUserProfileWithNpub = {
  profile:NDKUserProfile | undefined,
  npub:string,
  hexPubKey:string
}
