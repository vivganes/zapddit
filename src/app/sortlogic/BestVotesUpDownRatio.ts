import { SortLogic } from "./SortLogic";
import { NDKEventWithEngagement } from "../custom-type/NDKEventWithEngagement";
import { NDKEvent } from "@nostr-dev-kit/ndk";

export class BestVotesUpDownRatio implements SortLogic{
    compare(event1: NDKEventWithEngagement, event2: NDKEventWithEngagement): number {
       return BestVotesUpDownRatio.calculateLowerBoundOfWilsonScoreConfidenceInterval(event2) - BestVotesUpDownRatio.calculateLowerBoundOfWilsonScoreConfidenceInterval(event1);    
    } 
    
    static calculateLowerBoundOfWilsonScoreConfidenceInterval(event:NDKEventWithEngagement){
        if(event.upvotes + event.downvotes > 0){
            return ((event.upvotes + 1.9208) / (event.upvotes + event.downvotes) - 
            1.96 * Math.sqrt((event.upvotes * event.downvotes) / (event.upvotes + event.downvotes) + 0.9604) / 
                   (event.upvotes + event.downvotes)) / (1 + 3.8416 / (event.upvotes + event.downvotes));
        }
        return 0;       
    }
}