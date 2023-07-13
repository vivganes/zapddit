import { Component,Input } from '@angular/core';
import { TopicService } from '../../service/topic.service';

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

  constructor(private topicService:TopicService){
  }

  onTopicDelete(evt:any){
    evt.preventDefault();
    evt.stopImmediatePropagation();
    this.topicService.unfollowTopicInteroperableList(this.topic);
  }
}
