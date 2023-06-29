import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Community } from 'src/app/model/community';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';

const BUFFER_REFILL_PAGE_SIZE = 100;
const BUFFER_READ_PAGE_SIZE = 20;

@Component({
  selector: 'app-community-list',
  templateUrl: './community-list.component.html',
  styleUrls: ['./community-list.component.scss']
})
export class CommunityListComponent {

  communities?:Community[];
  until: number | undefined = Date.now();
  limit: number | undefined = BUFFER_REFILL_PAGE_SIZE;
  loadingEvents: boolean = false;
  loadingNextEvents: boolean = false;
  reachedEndOfFeed : boolean = false;
  nextEvents: Community[] | undefined;
  isLoggedInUsingPubKey:boolean = false;
  showOnlyOwnedCommunities: boolean = false;
  showOnlyFollowedCommunities: boolean = false;

  constructor(private ndkProvider:NdkproviderService, private router:Router){

  }

  ngOnInit(){
    const url = this.router.url;
    if(url.indexOf('/own')>-1){
      this.showOnlyOwnedCommunities = true;
    }

    this.ndkProvider.isLoggedInUsingPubKey$.subscribe(val => {
      this.isLoggedInUsingPubKey = val;
    });

    this.fetchCommunities();    
  }

  async fetchCommunities(){
    try{
      this.loadingEvents = true;
      this.communities = await this.ndkProvider.fetchCommunities(this.limit, undefined, this.until, this.showOnlyOwnedCommunities);
    } catch (err){
      console.error(err);
    } finally{
      this.loadingEvents = false;
    }
  }

}
