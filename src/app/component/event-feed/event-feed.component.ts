import { Component } from '@angular/core';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';

@Component({
  selector: 'app-event-feed',
  templateUrl: './event-feed.component.html',
  styleUrls: ['./event-feed.component.scss']
})
export class EventFeedComponent {

  private ndkProvider: NdkproviderService;
  events:Set<NDKEvent>|undefined;

  ngOnInit() {
    console.log("oninit")
    this.getEvents();
  }

  constructor(ndkProvider: NdkproviderService){
    this.ndkProvider = ndkProvider;
  }

  async getEvents(){
    this.events = await this.ndkProvider.fetchEvents();
  }

  isLoggedIn (): boolean {
    return this.ndkProvider.isLoggedIn()
  }

  

}
