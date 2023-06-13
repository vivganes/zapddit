import { Component, OnInit, ChangeDetectorRef,
  ChangeDetectionStrategy, ElementRef, ViewChild } from '@angular/core';
import { User } from 'src/app/model/user';
import { NdkproviderService } from '../../service/ndkprovider.service';
import { NDKUser, NDKUserProfile,NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';
import { ZappeditdbService } from '../../service/zappeditdb.service';
import { Constants } from '../../util/Constants';
import { OnDestroy } from '@angular/core';
import {  NgForm } from "@angular/forms";
import {
  BreakpointObserver,
  BreakpointState
} from '@angular/cdk/layout';
import { Subscription, BehaviorSubject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit, OnDestroy{
  readonly count:number=20;
  user={
    about:'',
    displayName:'',
    name:'',
    pictureUrl:'',
    hexPubKey:'',
    nip05:'',
    website:'',
    display_name:'',
    username:'',
    bio:'',
    lud16:'',
    banner:'',
    lud06:'',
    image:''
  };

  npub:string;
  @ViewChild("profileForm")
  profileForm: NgForm;
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
  isNip05Verified = false;
  fetchingPeopleIFollowFromRelay = true;
  fetchingMutedUsersFromRelay = true;
  offsetWhenUnfollowed:number = 0;
  limitWhenUnfollowed:number = 20;
  fetchingPeopleIFollowFromRelaySub:Subscription=new Subscription();
  fetchingMutedUsersFromRelaySub:Subscription=new Subscription();
  editMode:boolean = false
  newName:string='';
  newDisplayName:string='';
  newNIP05:string='';
  newAbout:string='';
  editPicture:boolean=false;
  pictureUrlChange = new BehaviorSubject('');
  showNewPicture:boolean = false;
  newPictureUrl:string='';
  saveDisabled:boolean = false;

  ngOnInit(): void {

    const filter:NDKFilter = { kinds: [0], authors:[this.ndkProvider.currentUser?.hexpubkey()!]}
    this.ndkProvider?.ndk?.fetchEvent(filter).then(event=>{
      this.user = JSON.parse(event.content);
      this.npub = this.ndkProvider.currentUser?.npub!
      this.changeDetectorRef.detectChanges();
    });

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

    this.ndkProvider.isLoggedInUsingPubKey$.subscribe(val =>{
      this.showFollowButton = !val;
    })

    this.ndkProvider.isNip05Verified$.subscribe(val=>{
      this.isNip05Verified = val
      this.changeDetectorRef.detectChanges();
    });

    this.fetchingPeopleIFollowFromRelaySub =this.ndkProvider.fetchingPeopleIFollowFromRelay$.subscribe(val=>{
      this.fetchingPeopleIFollowFromRelay = val

      if(val === false){
        this.fetchPeopleIFollow();
        this.changeDetectorRef.detectChanges();
      }
    });


    this.fetchingMutedUsersFromRelaySub = this.ndkProvider.fetchingMutedUsersFromRelay$.subscribe(val=>{
      this.fetchingMutedUsersFromRelay = val.status

      if(val.status === false){
        this.fetchPeopleIMuted();
        this.changeDetectorRef.detectChanges();
      }
    });

    this.pictureUrlChange
      .asObservable()
      .pipe(debounceTime(250))
      .subscribe(async value => {
        if(value && await this.checkImage(value)){
          this.showNewPicture = true;
        }
        else{
          this.showNewPicture = false;
          this.newPictureUrl = '';
        }
      });
  }

  constructor(private ndkProvider:NdkproviderService, private breakpointObserver: BreakpointObserver,
    private changeDetectorRef: ChangeDetectorRef, private dbService:ZappeditdbService) {
  }

  async fetchPeopleIMuted(){
      this.loadingPeopleYouMuted = true;
      console.log("loading muted people")

      var users =await this.dbService.mutedPeople.limit(this.mutedPeopleLimit).offset(this.mutedPeopleOffset).toArray()
      this.peopleIMuted.length = 0;
      this.peopleIMuted.push(...users);
      this.totalMutedPeople = await this.dbService.mutedPeople.count();
      this.loadingPeopleYouMuted = false;
      this.checkIfAllMutedPeopleFetched();

      this.changeDetectorRef.detectChanges();
      console.log("muted people loaded")
  }

  mutedTabClicked(){
    this.fetchPeopleIMuted();
  }

  followingTabClicked(){
      this.fetchPeopleIFollow();
  }

  async fetchPeopleIFollow(){
    this.loadingPeopleYouFollow = true;
    if(localStorage.getItem(Constants.FOLLOWERS_FROM_RELAY)=== 'false'){
    console.log("loading people i follow")

    var users = await this.dbService.peopleIFollow.limit(this.peopleIFollowLimit).offset(this.peopleIFollowOffset).toArray();
    this.peopleIFollow.length = 0;
    this.peopleIFollow.push(...users);
    this.totalPeopleIfollow = await this.dbService.peopleIFollow.count();
    this.loadingPeopleYouFollow = false;
    this.checkIfAllFetched();

    this.changeDetectorRef.detectChanges();
    console.log("people i follow load done")
    }
  }

  async loadMorePeopleIFollow(){
    this.loadingNextPeopleYouFollow = true;
    var currentLimit = this.peopleIFollowLimit
    this.peopleIFollowOffset = currentLimit;
    this.peopleIFollowLimit = currentLimit + this.count

    console.log("loading next people i follow")

    var users = await this.dbService.peopleIFollow.limit(currentLimit + this.count).offset(currentLimit).toArray()
    this.peopleIFollow.push(...users);
    this.checkIfAllFetched();
    this.loadingNextPeopleYouFollow = false;

    this.changeDetectorRef.detectChanges();
    console.log("next people I follow loaded")
  }

  async loadMoreMutedPeople(){
    this.loadingNextMutedPeople = true;
    console.log("loading next muted list")

    var currentLimit = this.mutedPeopleLimit
    this.mutedPeopleOffset = currentLimit;
    this.mutedPeopleLimit = currentLimit + this.count

    var users = await this.dbService.mutedPeople.limit(currentLimit + this.count).offset(currentLimit).toArray()
    this.peopleIMuted.push(...users);
    this.checkIfAllMutedPeopleFetched();
    this.loadingNextMutedPeople = false;

    this.changeDetectorRef.detectChanges();
    console.log("loaded next muted list")
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

  openInSnort(){
    window.open('https://snort.social/p/'+this.npub,'_blank')
  }

  ngOnDestroy(): void {
      this.fetchingPeopleIFollowFromRelaySub.unsubscribe();
      this.fetchingMutedUsersFromRelaySub.unsubscribe();
  }

 async onSave(){
    this.saveDisabled = true;
    await this.ndkProvider.saveMetadataAndFetchUserProfile(this.user!, this.newPictureUrl)
    if(this.newPictureUrl){
      this.user.image = this.newPictureUrl
    }
    this.saveDisabled = false;
    this.editPicture = false;
    this.showNewPicture = false;
    this.ndkProvider.currentUser?.fetchProfile();
    this.ndkProvider.currentUserProfile = this.ndkProvider.currentUser?.profile;
  }

  editPictureUrl(){
    this.editPicture= true;
  }

  updateNewPictureUrl(value:string){
    this.pictureUrlChange.next(value);
  }

  async checkImage(url:string):Promise<boolean>{
    const res = await fetch(url);
    const buff = await res.blob();
    return buff.type.startsWith('image/')
  }
}
