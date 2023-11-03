import { NDKUserProfile } from "@nostr-dev-kit/ndk";

export interface Community{
    creatorHexKey?:string,
    name?:string,
    displayName?:string,
    id?:string,
    description?:string,
    rules?:string,
    image?:string,
    creatorProfile?:NDKUserProfile,
    moderatorHexKeys?:string[],
    followersHexKeys?:string[],
    created_at?: number
}
