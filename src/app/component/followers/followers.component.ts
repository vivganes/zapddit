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
  loadingFollowers: boolean = false;

  ndkProvider: NdkproviderService;

  constructor(ndkProvider: NdkproviderService) {
    this.ndkProvider = ndkProvider;
  }

  ngOnInit() {
    this.loadingFollowers = true;
    this.ndkProvider.fetchFollowers().then((userProfiles) =>{
                                                this.userProfiles = userProfiles.map(profile=>profile)
                                                this.loadingFollowers = false;
                                              })
  }

  getImageUrls(): RegExpMatchArray | null | undefined {
    const urlRegex = /https:.*?\.(?:png|jpg|svg|gif|jpeg|webp)/gi;
    const imgArray = this.event?.content.match(urlRegex);
    return imgArray;
  }


  openProfileInSnort(userProfile:NDKUserProfile | undefined){
    //window.open('https://snort.social/p/'+npub,'_blank')
  }
}
