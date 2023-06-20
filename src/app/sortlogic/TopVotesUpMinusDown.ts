import { SortLogic } from "./SortLogic";
import { NDKEventWithEngagement } from "../custom-type/NDKEventWithEngagement";

export class TopVotesUpMinusDown implements SortLogic{
    compare(event1: NDKEventWithEngagement, event2: NDKEventWithEngagement): number {
        return  (event2.upvotes - event2.downvotes) - (event1.upvotes - event1.downvotes);  
    }    
}