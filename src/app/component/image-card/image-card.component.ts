import { Component, Input } from '@angular/core';
import { init } from 'linkifyjs';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import { ZappeditdbService } from 'src/app/service/zappeditdb.service';

@Component({
  selector: 'app-image-card',
  templateUrl: './image-card.component.html',
  styleUrls: ['./image-card.component.scss']
})
export class ImageCardComponent {
  @Input()
  imgSrc:string

  @Input()
  canLoadMedia:boolean=false

  @Input()
  authorPubKey:string

  @Input()
  showMediaFromPeopleIFollow:boolean = true;

  amIFollowingtheAuthor:boolean  = false;

  blurImageId:any = Math.floor(Math.random() * (5)) + 1;;


  constructor(private ndkProvider: NdkproviderService,private dbService: ZappeditdbService){
    
  }

  ngOnInit(){
    this.dbService.peopleIFollow.where({hexPubKey:this.authorPubKey}).count().then(async count=>{
      this.amIFollowingtheAuthor = count > 0;
      if(this.showMediaFromPeopleIFollow){
        this.canLoadMedia = count > 0;
      }

      // we do not want to override this flag, if user already clicked the media to view
      if(this.showMediaFromPeopleIFollow && !this.canLoadMedia){
        this.canLoadMedia = count > 0;
      }

      var loggedInUserHexPubKey = this.ndkProvider.currentUser?.hexpubkey();
      if(loggedInUserHexPubKey === this.authorPubKey){
        this.canLoadMedia =  true;
      }
  })
  }

  clickToLoadMedia(){
    this.canLoadMedia = true;
  }



}
