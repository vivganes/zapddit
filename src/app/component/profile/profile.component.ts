import { Component, OnInit, ChangeDetectorRef,
  ChangeDetectionStrategy } from '@angular/core';
import { User } from 'src/app/model/user';
import { NdkproviderService } from '../../service/ndkprovider.service';
import { NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
import {
  BreakpointObserver,
  BreakpointState
} from '@angular/cdk/layout';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit{
  user?:User;
  peopleIFollow: User[] = [];
  peopleIMuted: User[] = [];
  loadingPeopleYouFollow: boolean = false;
  loadingPeopleYouMuted: boolean = false;
  isMobileScreen:boolean = false;

  ngOnInit(): void {
    var userProfile = this.ndkProvider.currentUserProfile;
    var user = this.ndkProvider.currentUser;

    if(this.ndkProvider.currentUser && this.ndkProvider.currentUserProfile){
      this.user = {
        about: userProfile?.about!,
        name: userProfile?.name!,
        displayName:userProfile?.displayName!,
        npub:user?.npub!,
        nip05:userProfile?.nip05!,
        hexPubKey:user?.hexpubkey()!,
        pictureUrl:userProfile?.image!
      }
    }
    this.breakpointObserver
    .observe(['(min-width: 450px)'])
    .subscribe((state: BreakpointState) => {
      if (state.matches) {
        this.isMobileScreen = false;
        this.changeDetectorRef.detectChanges();
      } else {
        this.isMobileScreen = true;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  constructor(private ndkProvider:NdkproviderService, private breakpointObserver: BreakpointObserver,private changeDetectorRef: ChangeDetectorRef) {
    this.fetchPeopleIFollow();
    this.fetchPeopleIMuted();
  }

  fetchPeopleIMuted(){
    this.loadingPeopleYouMuted = true;

    this.ndkProvider.fetchMutedUsersFromCache().then(cachedMutedUsers=>{
      this.peopleIMuted = cachedMutedUsers;
      this.loadingPeopleYouMuted = false;
    });
  }

  mutedTabClicked(){
    if(this.peopleIMuted.length==0){
      this.fetchPeopleIMuted();
    }
  }

  followingTabClicked(){
    if(this.peopleIFollow.length==0){
      this.fetchPeopleIFollow();
    }
  }

  fetchPeopleIFollow(){
    this.loadingPeopleYouFollow = true;
    this.ndkProvider.fetchFollowersFromCache().then(cachedUsers =>{
      this.peopleIFollow = cachedUsers;
      this.loadingPeopleYouFollow = false;
    });
  }

  onContactListChange(){
    this.fetchPeopleIFollow();
  }

}
