import { Component, Input, SimpleChanges } from '@angular/core';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';

@Component({
  selector: 'app-event-feed',
  templateUrl: './event-feed.component.html',
  styleUrls: ['./event-feed.component.scss']
})
export class EventFeedComponent {

  @Input()
  tag: string | undefined;
  private ndkProvider: NdkproviderService;
  events:Set<NDKEvent>|undefined;

  ngOnInit() {
    console.log("oninit")
    this.getEvents();
  }

  ngOnChanges(changes: SimpleChanges) {
    for (let propName in changes) {
      let chng = changes[propName];
      let cur  = JSON.stringify(chng.currentValue);
      let prev = JSON.stringify(chng.previousValue);
      if(propName === 'tag'){
        this.getEvents();
      }
      console.log(`${propName}: currentValue = ${cur}, previousValue = ${prev}`);
  }  }

  constructor(ndkProvider: NdkproviderService){
    this.ndkProvider = ndkProvider;
  }

  async getEvents(){
    this.events = await this.ndkProvider.fetchEvents(this.tag || "");
  }

  isLoggedIn (): boolean {
    return this.ndkProvider.isLoggedIn()
  }

  

}
