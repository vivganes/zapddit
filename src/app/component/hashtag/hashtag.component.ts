import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hashtag',
  templateUrl: './hashtag.component.html',
  styleUrls: ['./hashtag.component.scss']
})
export class HashtagComponent {


  @Input()
  topic:string|undefined


  constructor(private router:Router){

  }

  navigateToNewTopic(mouseEvent:MouseEvent){
    mouseEvent.stopImmediatePropagation();
    mouseEvent.preventDefault();
    if(mouseEvent.metaKey || mouseEvent.ctrlKey || mouseEvent.button===1){
      var url = this.router.serializeUrl(this.router.createUrlTree(['t/'+this.topic]));
      window.open(url, '_blank');
      return
    }

    this.router.navigateByUrl('t/'+this.topic)
  }

  onMouseDown(event: MouseEvent) {
    // this is to be prevented for the middleclick event to be triggered as auxclick event
    event.preventDefault();
  }
}
