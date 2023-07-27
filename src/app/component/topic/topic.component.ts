import { Component,Input } from '@angular/core';
import { TopicService } from '../../service/topic.service';
import { Constants } from 'src/app/util/Constants';
import { NdkproviderService } from '../../service/ndkprovider.service';

@Component({
  selector: 'app-topic',
  templateUrl: './topic.component.html',
  styleUrls: ['./topic.component.scss']
})
export class TopicComponent {
  hideElement:boolean = true;

  @Input()
  isMobileScreen:boolean = false;

  @Input()
  topic:string;

  @Input()
  sidebarCollapsed:boolean = false;

  constructor(private topicService:TopicService, private ndkProvider:NdkproviderService){
  }

  async onTopicDelete(evt:any){
    evt.preventDefault();
    evt.stopImmediatePropagation();

    if(this.ndkProvider.isTryingZapddit){
      this.topicService.unFollowTryZapddit(this.topic);
      return;
    }

    this.topicService.unfollowTopicInteroperableList(this.topic);

    await this.topicService.clearTopicsFromAppData();
  }
}
