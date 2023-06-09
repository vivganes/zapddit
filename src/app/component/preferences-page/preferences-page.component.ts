import { ChangeDetectorRef, Component } from '@angular/core';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import { TopicService } from 'src/app/service/topic.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { RelaysService } from "src/app/service/relays.service";
import '@cds/core/checkbox/register.js';
import { Constants } from '../../util/Constants';
import { LoginUtil } from 'src/app/util/LoginUtil';

@Component({
  selector: 'app-preferences-page',
  templateUrl: './preferences-page.component.html',
  styleUrls: ['./preferences-page.component.scss']
})
export class PreferencesPageComponent {

  downzapRecipientsError: string | undefined;
  downzapSetSuccessMessage: string | undefined;
  topicService: TopicService;
  isLoggedInUsingPubKey:boolean = false;

  ndkProvider: NdkproviderService;
  settingDefaultSats:boolean = false;
  mutingTopic: boolean = false;
  loadContentFromPeopleIFollow:boolean = true;
  changeDetector:ChangeDetectorRef;

  constructor(ndkProvider: NdkproviderService, topicService: TopicService, changeDetector: ChangeDetectorRef,private clipboard: Clipboard) {
    this.ndkProvider = ndkProvider;
    this.topicService = topicService;    
    this.changeDetector = changeDetector;
  }

  ngOnInit(){
    var mediaSettings = localStorage.getItem(Constants.SHOWMEDIA)
    if(mediaSettings!=null || mediaSettings!=undefined || mediaSettings!=''){
      this.loadContentFromPeopleIFollow = Boolean(JSON.parse(mediaSettings!));
    }
    this.ndkProvider.isLoggedInUsingPubKey$.subscribe(val =>{
      Promise.resolve().then(() => {
        this.isLoggedInUsingPubKey = val;
        this.changeDetector.detectChanges();
      });    
        
    })
    this.ndkProvider.getUserSubscribedRelays();
  }

  copyPrivateKey(){
    const privateKeyHex = localStorage.getItem('privateKey')
    this.clipboard.copy(LoginUtil.hexToBech32("nsec",privateKeyHex!))
  }

  async saveDownzapRecipients() {
    this.downzapSetSuccessMessage = undefined;
    this.downzapRecipientsError = undefined;
    let recipients = (<HTMLInputElement>document.getElementById('downzap-recipients')).value;
    let supposedUser = await this.ndkProvider.getNdkUserFromNpub(recipients);
    if (supposedUser !== undefined) {
      this.ndkProvider.publishAppData(undefined, recipients);
      this.downzapSetSuccessMessage =
        'Sending downzaps to ' +
        (supposedUser.profile?.displayName ? supposedUser.profile?.displayName : supposedUser.profile?.name);
    } else {
      this.downzapRecipientsError = 'Invalid npub';
    }
  }

  setDefaultSats() {
    this.settingDefaultSats = true;
    let sats = (<HTMLInputElement>document.getElementById('sats-for-zaps')).value;
    try{
      this.ndkProvider.setDefaultSatsForZaps(Number.parseInt(sats));
      }catch(e){
        console.error(e);
      } finally{
        this.settingDefaultSats = false;
      }
  }

  muteTopic(){
    this.mutingTopic = true;
    let topic =  (<HTMLInputElement>document.getElementById('topic-to-mute')).value;
    if(topic.startsWith('#')){
      topic = topic.slice(1);
    }
    try{
      this.topicService.muteTopic(topic);
    }catch(e){
      console.error(e);
    }finally{
      this.mutingTopic =  false;
    }
  }

  unmuteTopic(topic: string){
    try{
      this.topicService.unmuteTopic(topic);
    }catch(e){
      console.error(e);
    }
  }

  onMediaSettingChange(checked:any){
    localStorage.setItem(Constants.SHOWMEDIA,checked);
  }
}
