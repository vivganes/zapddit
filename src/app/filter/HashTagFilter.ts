import { NDKEvent, NDKTag } from "@nostr-dev-kit/ndk";

export class HashTagFilter{
    static notHashTags(mutedTags:string[]):(value: NDKEvent, index: number, array: NDKEvent[]) => boolean{
        console.log("notHashTags: mutedTags "+ mutedTags);
        let filter:(value: NDKEvent) => boolean 
        filter = (event:NDKEvent):boolean=>{
            const eventTextLowerCase = event.content?.toLowerCase();
            if(!eventTextLowerCase) return true;            
            for (let tag of mutedTags) {
                if (eventTextLowerCase.includes('#' + tag.toLowerCase())) {
                    return false;
                }
            }            
            return true;            
        }
        return filter;
    }
}