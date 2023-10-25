import { Component, Input, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { NdkproviderService } from '../../service/ndkprovider.service';
import { NgForm } from '@angular/forms';
import { BehaviorSubject, debounceTime } from 'rxjs';
import { Community } from '../../model/community';
import { CommunityService } from '../../service/community.service';
import { LoginUtil } from 'src/app/util/LoginUtil';
import { NDKUser } from '@nostr-dev-kit/ndk';

@Component({
  selector: 'app-create-community',
  templateUrl: './create-community.component.html',
  styleUrls: ['./create-community.component.scss']
})
export class CreateCommunityComponent implements OnInit{

  @Input()
  show:boolean = false;

  @Output()
  onClose = new EventEmitter<boolean>();

  @Output()
  onEditComplete = new EventEmitter<Community>();

  @ViewChild("newCommunityForm")
  newCommunityForm:NgForm;
  createDisabled:boolean=true;
  currentModSuggestionNpub:string;
  @Input()
  editMode:boolean = false;

  displayNameChange = new BehaviorSubject('');
  @Input()
  newCommunity:Community;

  constructor(private ndkproviderService:NdkproviderService, private communityService:CommunityService){
  }

  ngOnInit(): void {
    if(this.ndkproviderService.currentUser){
      if(!this.editMode){
        this.newCommunity = {
          creatorHexKey: this.ndkproviderService.currentUser.pubkey,
          moderatorHexKeys:[this.ndkproviderService.currentUser.pubkey]
        }
      } else {
        if(this.newCommunity && !this.newCommunity.moderatorHexKeys){
          this.newCommunity.moderatorHexKeys = [this.newCommunity.creatorHexKey!]
        } else if (this.newCommunity.moderatorHexKeys?.indexOf(this.newCommunity.creatorHexKey!) === -1){
          this.newCommunity.moderatorHexKeys.push(this.newCommunity.creatorHexKey!);     
        }
      }  
    }
    if(this.editMode){
      this.createDisabled = false;
    }    

    if(!this.editMode){
      this.displayNameChange
          .asObservable()
          .pipe(debounceTime(250))
          .subscribe(value => {
            if (value)
            {
              this.createDisabled=false;
              this.sanitizeDisplayName();
            }
              else
              this.createDisabled=true;
          });
    }
  }

  onChange($event:any){
    this.onClose.emit(false);
  }

  displayNameUpdate($event:any){
    this.displayNameChange.next($event);
  }

  async onCreate(){
    await this.communityService.createCommunity(this.newCommunity);
    if(this.editMode){
      this.onEditComplete.emit(this.newCommunity)
    }
    this.onClose.emit(true);
    this.newCommunity={};
  }

  addModerator(evt:any){
    evt.preventDefault();
    if(this.currentModSuggestionNpub.trim() !== ''){
      const hexKey:string = LoginUtil.bech32ToHex(this.currentModSuggestionNpub.trim());
      if(this.newCommunity.moderatorHexKeys?.indexOf(hexKey) === -1){
        this.newCommunity.moderatorHexKeys?.push(hexKey)
      }
    }    
  }

  deleteModerator(user:NDKUser){
    this.newCommunity.moderatorHexKeys = this.newCommunity.moderatorHexKeys?.filter((key) => key!==user.pubkey);
  }

  sanitizeDisplayName(){
    this.newCommunity.name = this.newCommunity.displayName!.replace(/[:\s]/g,'');
  }
}
