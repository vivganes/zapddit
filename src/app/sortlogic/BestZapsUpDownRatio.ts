import { SortLogic } from "./SortLogic";
import { NDKEventWithEngagement } from "../custom-type/NDKEventWithEngagement";

export class BestZapsUpDownRatio implements SortLogic{
    compare(event1: NDKEventWithEngagement, event2: NDKEventWithEngagement): number {
        if(event2.downzaps !== 0){
            if(event1.downzaps !== 0){
                return  (event2.upzaps/event2.downzaps) - (event1.upzaps/event1.downzaps);
            }
            return (event2.upzaps/event2.downzaps) - 99999999;
        }
        return 0  ;      
    }    
}