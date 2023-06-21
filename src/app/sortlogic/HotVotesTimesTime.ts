import { NDKEventWithEngagement } from "../custom-type/NDKEventWithEngagement";
import { SortLogic } from "./SortLogic";

export class HotVotesTimesTime implements SortLogic{
    compare(event1: NDKEventWithEngagement, event2: NDKEventWithEngagement): number {
        return  (event2.upvotes*event2.created_at!) - (event1.upvotes*event1.created_at!);  
    }    
}