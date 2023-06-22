import { NDKEventWithEngagement } from "../custom-type/NDKEventWithEngagement";
import { SortLogic } from "./SortLogic";

export class HotVotesTimesTime implements SortLogic{
    compare(event1: NDKEventWithEngagement, event2: NDKEventWithEngagement): number {
        return HotVotesTimesTime.getHotnessIndex(event2) - HotVotesTimesTime.getHotnessIndex(event1);
    } 
    
    static getHotnessIndex(event:NDKEventWithEngagement){
        return Math.log(Math.abs(event.upvotes-event.downvotes)) + (Date.now() - event.created_at!/45000)
    }
}