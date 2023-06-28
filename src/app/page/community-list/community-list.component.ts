import { Component } from '@angular/core';
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

  constructor(private ndkProvider:NdkproviderService){

  }

  ngOnInit(){
    this.ndkProvider.isLoggedInUsingPubKey$.subscribe(val => {
      this.isLoggedInUsingPubKey = val;
    });

    this.fetchCommunities();    
  }

  async fetchCommunities(){
    this.loadingEvents = true;
    this.communities = await this.ndkProvider.fetchCommunities(this.limit, undefined, this.until);
    this.loadingEvents = false;
  }

}
