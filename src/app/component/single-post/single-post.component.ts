import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';

@Component({
  selector: 'app-single-post',
  templateUrl: './single-post.component.html',
  styleUrls: ['./single-post.component.scss'],
})
export class SinglePostComponent {

  event?:NDKEvent

  constructor(route:ActivatedRoute,private ndkProvider: NdkproviderService){
    route.params.subscribe(async params => {
      let noteid = params['noteid'];
      this.event = await this.getNote(noteid)
    });
  }

  async getNote(id:string){
    return await this.ndkProvider.fetchEventFromId(id)
  }
}
