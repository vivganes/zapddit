import { Injectable } from '@angular/core';
import { ObjectCacheService } from './object-cache.service';
import { Community } from '../model/community';

@Injectable({
  providedIn: 'root'
})
export class CommunityCacheService {

  constructor(private objectCache:ObjectCacheService) { }

  async fetchCommunityWithId(id:string):Promise<Community|undefined>{
    const community:Community|undefined = await this.objectCache.communities.get(id);
    if(community){
      console.log("community:hit");
      return community;
    }
    console.log("community:miss");
    return undefined;
  }

  async addCommunity(item:Community){
    this.objectCache.communities.put(item, item.id);

    const self = this;
    setTimeout(() => {
      console.log("Deleting item with key "+ item.id)
      self.deleteCommunityWithId(item.id!)
    }, this.objectCache.defaultTTL*1000);
  }

  deleteCommunityWithId(id:string){
    this.objectCache.communities.delete(id);
  }
}
