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

  constructor(private topicService:TopicService){
  }

  onTopicDelete(){
    this.topicService.unfollowTopic(this.topic);
  }
}
