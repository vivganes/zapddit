import { Injectable } from '@angular/core';
import { ObjectCacheService } from './object-cache.service';
import { Community } from '../model/community';

@Injectable({
  providedIn: 'root',
})
export class CommunityPageService {
  constructor(private objectCache: ObjectCacheService) {}

  fastForward(lastRow: Community, idProp: string) {
    let fastForwardComplete = false;
    return (item: Community) => {
      if (fastForwardComplete) return true;
      //@ts-ignore
      if (item[idProp] === lastRow[idProp]) {
        fastForwardComplete = true;
      }
      return false;
    };
  }

  async getPageWithNumber(pageNumber:number) {
    const PAGE_SIZE = 10;

    // A helper function we will use below.
    // It will prevent the same results to be returned again for next page.

    // Criterion filter in plain JS:
    const criterionFunction = (community: Community) => community.id !== undefined; // Just an example...

    //
    // Query First Page
    //
    let page = await this.objectCache.communities
      .orderBy('created_at') // Utilize index for sorting
      .filter(criterionFunction)
      .limit(PAGE_SIZE)
      .toArray();
    if(pageNumber === 0){
      return page;
    }

    //
    // Page 2
    //
    // "page" variable is an array of results from last request:
    if (page.length < PAGE_SIZE) return; // Done
    let lastEntry = page[page.length - 1];
    page = await this.objectCache.communities
      // Use index to fast forward as much as possible
      // This line is what makes the paging optimized
      .where('created_at')
      .belowOrEqual(lastEntry.created_at) // makes it sorted by lastName

      // Use helper function to fast forward to the exact last result:
      .filter(this.fastForward(lastEntry, 'id'))
      .limit(PAGE_SIZE)
      .toArray();
    if (pageNumber === 1){
      return page;
    }
    //
    // Page N
    //
    if (page.length < PAGE_SIZE) return; // Done
    lastEntry = page[page.length - 1];
    page = await this.objectCache.communities
      .where('created_at')
      .belowOrEqual(lastEntry.created_at)
      .filter(this.fastForward(lastEntry, 'id'))
      .limit(PAGE_SIZE)
      .toArray();
    return page;
  }
}
