import { Component, Input, OnInit } from '@angular/core';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import { NDKEvent, NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';

@Component({
  selector: 'app-followers',
  templateUrl: './followers.component.html',
  styleUrls: ['./followers.component.scss']
})
export class FollowersComponent implements OnInit{

  userProfiles: (NDKUserProfile | undefined)[] = [];
  event: NDKEvent | undefined;
  loadingPeopleYouFollow: boolean = false;

  ndkProvider: NdkproviderService;

  constructor(ndkProvider: NdkproviderService) {
    this.ndkProvider = ndkProvider;
  }

  ngOnInit() {
    this.loadingPeopleYouFollow = true;
    this.ndkProvider.fetchFollowers().then((userProfiles) =>{
                                                //this.userProfiles = userProfiles.map(profile=>profile)
                                                this.userProfiles = []
                                                this.loadingPeopleYouFollow = false;
                                              })
  }

  getImageUrls(): RegExpMatchArray | null | undefined {
    const urlRegex = /https:.*?\.(?:png|jpg|svg|gif|jpeg|webp)/gi;
    const imgArray = this.event?.content.match(urlRegex);
    return imgArray;
  }
}
