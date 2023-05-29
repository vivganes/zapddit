import { Component, Input, OnInit } from '@angular/core';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import { ZappeditdbService } from 'src/app/service/zappeditdb.service';
import '@cds/core/icon/register.js';
import '@cds/core/button/register.js';
import { User } from 'src/app/model/user';

@Component({
  selector: 'app-people-i-follow',
  templateUrl: './peopleifollow.component.html',
  styleUrls: ['./peopleifollow.component.scss']
})

export class PeopleIFollowComponent implements OnInit{

  users: User[] = [];
  loadingPeopleYouFollow: boolean = false;

  constructor(private ndkProvider: NdkproviderService, private dbService:ZappeditdbService) {
    this.fetchContactList();
  }

  fetchContactList(){
    this.ndkProvider.fetchFollowersFromCache().then(cachedUsers =>{
      this.users = cachedUsers;
      this.loadingPeopleYouFollow = false;
    });
  }

  ngOnInit() {
    this.loadingPeopleYouFollow = true;
  }

  onContactListChange(){
    this.fetchContactList();
  }
}

