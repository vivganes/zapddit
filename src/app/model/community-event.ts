import NDK, { NDKTag, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { Community } from './community';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { ReplaceableEvent } from './replaceable-event';

export class CommunityEvent extends ReplaceableEvent<Community>
{
    constructor(ndk:NDK, community:Community){
      super(community, ndk);
    }

    override buildEvent(existing:Community[]): NDKEvent {
      var event = this.createEvent();
      let tags: NDKTag[] = [];
      tags.push(['d', 'communities']);
      tags.push(['a',`34450:${this.data.creatorHexKey}:${this.data.name!}`])

      for(let item of existing){
        if(item.id)
          tags.push(['a',`${item.id}`])
        else
          tags.push(['a',`34450:${item.creatorHexKey}:${item.name!}`])
      }

      event.tags = tags;
      event.kind = 30001;
      return event;
    }
}
