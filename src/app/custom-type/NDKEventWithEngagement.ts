
import { NDKEvent } from '@nostr-dev-kit/ndk';
export interface NDKEventWithEngagement extends NDKEvent{
  upvotes:number,
  downvotes:number,
  comments:number,
  upzaps:number,
  downzaps:number
}