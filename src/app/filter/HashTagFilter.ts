import { NDKEvent, NDKTag } from "@nostr-dev-kit/ndk";

export class HashTagFilter{



    static notHashTags(mutedTags:string[]):(value: NDKEvent, index: number, array: NDKEvent[]) => boolean{
        console.log("muted: "+ mutedTags);
        let filter:(value: NDKEvent) => boolean 
        filter = (event:NDKEvent):boolean=>{
            const tagsInEvent:NDKTag[] =  event.getMatchingTags('t');
            console.log(tagsInEvent);
            const tagsList = HashTagFilter.getHashTagsListFromMatchingTags(tagsInEvent);
            console.log(tagsList);
            return tagsList.every((tagInEvent) => !mutedTags.includes(tagInEvent))
        }
        return filter;
    }

    static getHashTagsListFromMatchingTags(matchingTags: NDKTag[]){
        const tags = [];
        console.log(matchingTags);
        for (let tag of matchingTags){
            console.log(tag);
            tags.push(tag[1]);
        }
        return tags;
    }
}