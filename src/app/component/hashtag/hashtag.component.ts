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

  navigateToNewTopic(mouseEvent:any){
    mouseEvent.stopImmediatePropagation();
    mouseEvent.preventDefault();
    this.router.navigateByUrl('t/'+this.topic)
  }
}
