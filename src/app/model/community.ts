import { NDKUserProfile } from "@nostr-dev-kit/ndk";

export interface Community{
    creatorHexKey?:string,
    name?:string,
    id?:string,
    description?:string,
    image?:string,
    creatorProfile?:NDKUserProfile,
    moderatorHexKeys?:string[]
}