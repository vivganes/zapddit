import { NDKEvent } from "@nostr-dev-kit/ndk";
import { SortLogic } from "./SortLogic";

export class ReverseChrono implements SortLogic{
    compare(event1: NDKEvent, event2: NDKEvent): number {
        return event2.created_at! - event1.created_at!;
    }    
}