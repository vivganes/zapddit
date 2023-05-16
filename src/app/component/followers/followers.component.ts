import { Component, Input, OnInit } from '@angular/core';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import { ZappeditdbService } from 'src/app/service/zappeditdb.service';
import { NDKEvent, NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
import '@cds/core/icon/register.js';
import '@cds/core/button/register.js';
import { User } from 'src/app/model/user';

@Component({
  selector: 'app-followers',
  templateUrl: './followers.component.html',
  styleUrls: ['./followers.component.scss']
})

export class FollowersComponent implements OnInit{

  users: User[] = [];
  event: NDKEvent | undefined;
  loadingPeopleYouFollow: boolean = false;

  constructor(private ndkProvider: NdkproviderService,private dbService:ZappeditdbService) {
  }

  ngOnInit() {
    this.loadingPeopleYouFollow = true;
    this.ndkProvider.fetchFollowersAndCache().then(async ()=>
      await this.dbService.users.toArray().then(cachedUsers=>
        {
          this.users = cachedUsers;
          this.loadingPeopleYouFollow = false;
          console.log("loaded from cache - "+ cachedUsers?.length);
        })
    );
  }

  getImageUrls(): RegExpMatchArray | null | undefined {
    const urlRegex = /https:.*?\.(?:png|jpg|svg|gif|jpeg|webp)/gi;
    const imgArray = this.event?.content.match(urlRegex);
    return imgArray;
  }
}

