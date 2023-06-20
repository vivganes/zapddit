export class EventBuffer<T>{

    events?:T[]

    /**
     * 
     * @param startIndex 
     * @param endIndex 
     * @returns items with indexes including startIndex and endIndex
     * NULL if startIndex > events.length
     * If endIndex > events.length, return upto last element of events
     */
    getItemsWithIndexes(startIndex:number, endIndex:number):(T[]|null){
        if(this.events){
            if(startIndex>this.events.length-1){
                return null;
            }
            if(endIndex >= this.events.length){
                return this.events.slice(startIndex,this.events.length);
            }            
            return this.events?.slice(startIndex,endIndex+1);
        }
        return []
    }   

    refillWithEntries(newEntries : T[]){
        if(this.events){
            this.events = this.events.concat(newEntries);
        } else{
            this.events = newEntries;
        }
    }
    
}