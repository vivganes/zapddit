import { NDKEvent } from "@nostr-dev-kit/ndk";

export interface SortLogic{
    compare(event1:NDKEvent, event2:NDKEvent): number
}