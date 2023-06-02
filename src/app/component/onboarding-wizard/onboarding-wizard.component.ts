import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';

@Component({
  selector: 'app-onboarding-wizard',
  templateUrl: './onboarding-wizard.component.html',
  styleUrls: ['./onboarding-wizard.component.scss']
})
export class OnboardingWizardComponent {

  @Input()
  open:boolean = false;

  @Output()
  openChange:EventEmitter<boolean> = new EventEmitter<boolean>();
  dailyDoseSeeker:boolean = false;
  btcMaxi:boolean = false;
  foodLover:boolean = false;
  plebLover:boolean = false;
  clientsFan:boolean = false;
  cryptoRepeller:boolean = false;
  weirdStuffRepeller:boolean = false;
  suggestedTopics: string[] = [];
  muteList: string[] = [];

  constructor(private ndkProvider:NdkproviderService){

  }

  updateTopics(){
    let newTopics = []
    if(this.dailyDoseSeeker){
      newTopics.push('coffeechain','chaichain','nostr','nostrich','nostriches');
    }
    if(this.btcMaxi){
      newTopics.push('bitcoin','shitcoin')
    }
    if(this.foodLover){
      newTopics.push('foodstr','foodchain')
    }
    if(this.plebLover){
      newTopics.push('plebchain','zapathon')
    }
    if(this.clientsFan){
      newTopics.push('amethyst','damus','iris','coracle','zapddit','client','nostrclient')
    }
    this.suggestedTopics = newTopics
  }

  updateMuteList(){
    let mutedTopics = []
    if(this.cryptoRepeller){
      mutedTopics.push('bitcoin','shitcoin','crypto')
    }
    if(this.weirdStuffRepeller){
      mutedTopics.push('footstr','feetstr','boobstr','nudestr')
    }
    this.muteList = mutedTopics;
  }

  acceptChoices(){
    let alreadyFollowedTopics:string[] = []
    let followedTopicsToBePublished = []
    let alreadyFollowedTopicsString = this.ndkProvider.appData.followedTopics;
    if(alreadyFollowedTopicsString === ''){
      alreadyFollowedTopics = [];
    } else {
      alreadyFollowedTopics = alreadyFollowedTopicsString.split(",");
    }
    followedTopicsToBePublished = [...alreadyFollowedTopics,...this.suggestedTopics];
    followedTopicsToBePublished = [...new Set(followedTopicsToBePublished)];

    let alreadyMutedTopics:string[] = []
    let mutedTopicsToBePublished = []
    let alreadyMutedTopicsString = this.ndkProvider.appData.mutedTopics;
    if(alreadyMutedTopicsString === ''){
      alreadyMutedTopics = [];
    } else {
      alreadyMutedTopics = alreadyMutedTopicsString.split(",");
    }
    mutedTopicsToBePublished = [...alreadyMutedTopics,...this.muteList];
    mutedTopicsToBePublished = [...new Set(mutedTopicsToBePublished)];

    this.ndkProvider.publishAppData(followedTopicsToBePublished.join(','), undefined, mutedTopicsToBePublished.join(','));
  }

  markWizardClosed(){
    this.open = false;
    this.openChange.emit(this.open)
  }
  

}
