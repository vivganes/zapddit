import { SortLogic } from "./SortLogic";
import { NDKEventWithEngagement } from "../custom-type/NDKEventWithEngagement";

export class TopZapsUpMinusDown implements SortLogic{
    compare(event1: NDKEventWithEngagement, event2: NDKEventWithEngagement): number {
        return  (event2.upzaps - event2.downzaps) - (event1.upzaps - event1.downzaps);
    }    
}