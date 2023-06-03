import { Component, OnInit, ChangeDetectorRef,
  ChangeDetectionStrategy } from '@angular/core';
import { User } from 'src/app/model/user';
import { NdkproviderService } from '../../service/ndkprovider.service';
import { NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
import { ZappeditdbService } from '../../service/zappeditdb.service';
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
  readonly count:number=20;
  user?:User;
  peopleIFollow: User[] = [];
  peopleIMuted: User[] = [];
  peopleIFollowLimit:number = 20;
  mutedPeopleLimit:number = 20;
  peopleIFollowOffset:number = 0;
  mutedPeopleOffset:number = 0;
  loadingPeopleYouFollow: boolean = false;
  loadingNextPeopleYouFollow: boolean = false;
  loadingNextMutedPeople: boolean = false;
  loadingPeopleYouMuted: boolean = false;
  isMobileScreen:boolean = false;
  totalPeopleIfollow:number=0;
  totalMutedPeople:number=0;
  reachedEndOfPeopleIFollow:boolean = false;
  reachedEndOfMutedPeople = false;
  showFollowButton = true;

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

    this.ndkProvider.$loadingMutedPeople.subscribe((value)=>{
      if(value){
        this.fetchPeopleIMuted();
      }
    });

    this.showFollowButton = !this.ndkProvider.isLoggedInUsingPubKey
  }

  constructor(private ndkProvider:NdkproviderService, private breakpointObserver: BreakpointObserver,
    private changeDetectorRef: ChangeDetectorRef, private dbService:ZappeditdbService) {
  }

  async fetchPeopleIMuted(){
      this.loadingPeopleYouMuted = true;
      this.totalMutedPeople = await this.dbService.mutedPeople.count();

      console.log("loading muted people")

      this.dbService.mutedPeople.limit(this.mutedPeopleLimit).offset(this.mutedPeopleOffset).toArray().then(users=>{
        this.peopleIMuted.length = 0;
        this.peopleIMuted.push(...users);
        this.checkIfAllMutedPeopleFetched();

      }).finally(()=>{
        console.log("muted people loaded")
        this.loadingPeopleYouMuted = false;
      });
  }

  mutedTabClicked(){
    this.fetchPeopleIMuted();
  }

  followingTabClicked(){
      this.fetchPeopleIFollow();
  }

  async fetchPeopleIFollow(){
    this.loadingPeopleYouFollow = true;
    this.totalPeopleIfollow = await this.dbService.peopleIFollow.count();

    console.log("loading people i follow")
    this.dbService.peopleIFollow.limit(this.peopleIFollowLimit).offset(this.peopleIFollowOffset).toArray().then(users=>{
      this.peopleIFollow.length = 0;
      this.peopleIFollow.push(...users);
      this.checkIfAllFetched();
    }).finally(()=>{
      console.log("people i follow load done")
      this.loadingPeopleYouFollow = false;
    });
  }

  loadMorePeopleIFollow(){
    this.loadingNextPeopleYouFollow = true;
    var currentLimit = this.peopleIFollowLimit
    this.peopleIFollowOffset = currentLimit;
    this.peopleIFollowLimit = currentLimit + this.count
    console.log("loading next people i follow")

    this.dbService.peopleIFollow.limit(currentLimit + this.count).offset(currentLimit).toArray().then(users=>{
      this.peopleIFollow.push(...users);
      this.changeDetectorRef.detectChanges();
      this.loadingNextPeopleYouFollow = false;

      this.checkIfAllFetched();
    }).finally(()=>{
      console.log("loading next people i follow done")
      this.loadingNextPeopleYouFollow = false;
    });
  }

  loadMoreMutedPeople(){
    this.loadingNextMutedPeople = true;
    var currentLimit = this.mutedPeopleLimit
    this.mutedPeopleOffset = currentLimit;
    this.mutedPeopleLimit = currentLimit + this.count
    console.log("loading next muted list")

    this.dbService.mutedPeople.limit(currentLimit + this.count).offset(currentLimit).toArray().then(users=>{
      this.peopleIMuted.push(...users);
      this.changeDetectorRef.detectChanges();
      this.loadingNextMutedPeople = false;

      this.checkIfAllMutedPeopleFetched();
    }).finally(()=>{
      console.log("loading next muted list")
      this.loadingNextMutedPeople = false;
    });

  }

  checkIfAllFetched(){
    if(this.totalPeopleIfollow === this.peopleIFollow.length){
      this.reachedEndOfPeopleIFollow = true;
    }
  }

  checkIfAllMutedPeopleFetched(){
    if(this.totalMutedPeople === this.peopleIMuted.length){
      this.reachedEndOfMutedPeople = true;
    }
  }

  onContactListChange(){
    this.fetchPeopleIFollow();
  }

}
