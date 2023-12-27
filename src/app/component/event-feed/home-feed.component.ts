import { Component } from "@angular/core";
import { EventFeedComponent } from "./event-feed.component";

@Component({
    selector: 'app-event-feed',
    templateUrl: './event-feed.component.html',
    styleUrls: ['./event-feed.component.scss'],
  })
  export class HomeFeedComponent extends EventFeedComponent{

  }
  