import { NDKEvent, NDKTag } from "@nostr-dev-kit/ndk";

export class HashTagFilter{



    static notHashTags(mutedTags:string[]):(value: NDKEvent, index: number, array: NDKEvent[]) => boolean{
        let filter:(value: NDKEvent) => boolean 
        filter = (event:NDKEvent):boolean=>{
            const tagsInEvent:NDKTag[] =  event.getMatchingTags('t');
            const tagsList = HashTagFilter.getHashTagsListFromMatchingTags(tagsInEvent);
            return tagsList.every((tagInEvent) => !mutedTags.includes(tagInEvent))
        }
        return filter;
    }

    static getHashTagsListFromMatchingTags(matchingTags: NDKTag[]){
        const tags = [];
        for (let tag of matchingTags){
            tags.push(tag[1]);
        }
        return tags;
    }
}