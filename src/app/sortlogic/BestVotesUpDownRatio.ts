import { SortLogic } from "./SortLogic";
import { NDKEventWithEngagement } from "../custom-type/NDKEventWithEngagement";

export class BestVotesUpDownRatio implements SortLogic{
    compare(event1: NDKEventWithEngagement, event2: NDKEventWithEngagement): number {
        if(event2.downvotes !== 0){
            if(event1.downvotes !== 0){
                return  (event2.upvotes/event2.downvotes) - (event1.upvotes/event1.downvotes);
            }
            return (event2.upvotes/event2.downvotes) - 99999999;
        }
        return 0  ;      
    }    
}