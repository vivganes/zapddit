import { ChangeDetectorRef, Component } from '@angular/core';
import { FormGroup, FormControl } from "@angular/forms";
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import { RelayService } from "src/app/service/relay.service";
import { TopicService } from 'src/app/service/topic.service';
import { Clipboard } from '@angular/cdk/clipboard';
import '@cds/core/checkbox/register.js';
import { Constants } from '../../util/Constants';
import { LoginUtil } from 'src/app/util/LoginUtil';
import { Relay } from "../../model";
import { TranslateService } from '@ngx-translate/core';
import ZapSplitConfig from 'src/app/model/ZapSplitConfig';
import { ZapSplitUtil } from 'src/app/util/ZapSplitUtil';

@Component({
  selector: 'app-preferences-page',
  templateUrl: './preferences-page.component.html',
  styleUrls: ['./preferences-page.component.scss'],
})
export class PreferencesPageComponent {
  downzapRecipientsError: string | undefined;
  downzapSetSuccessMessage: string | undefined;
  topicService: TopicService;
  isLoggedInUsingPubKey: boolean = false;
  downzapRecipientInForm?: string;

  ndkProvider: NdkproviderService;
  settingDefaultSats: boolean = false;
  mutingTopic: boolean = false;
  addingRelay: boolean = false;
  loadContentFromPeopleIFollow: boolean = true;
  hideNonZapReactions: boolean = false;
  showUnapprovedPosts: boolean = false;
  showCommunitiesFeedByDefault:boolean = false;
  changeDetector: ChangeDetectorRef;
  mutedTopics:string[]=[];
  currentLanguage:string;
  zapSplitConfig?:ZapSplitConfig;

  relayUrls: string[] | undefined;
  relays: Relay[];
  relayService: RelayService;

  userForm = new FormGroup({
    url: new FormControl,
    read: new FormControl,
    write: new FormControl
  })

  constructor(
    ndkProvider: NdkproviderService,
    topicService: TopicService,
    changeDetector: ChangeDetectorRef,
    private clipboard: Clipboard,
    relayService: RelayService,
    private translate: TranslateService
  ) {
    this.ndkProvider = ndkProvider;
    this.topicService = topicService;
    this.changeDetector = changeDetector;
    this.relayService = relayService;
  }

  updateLanguage(){
    this.translate.use(this.currentLanguage)
    localStorage.setItem(Constants.LANGUAGE, this.currentLanguage)
    if(this.zapSplitConfig){    
      this.zapSplitConfig.translators = ZapSplitUtil.getZapSplitEntriesForTranslators(this.currentLanguage);
    } else {
      this.zapSplitConfig = ZapSplitUtil.prepareDefaultZapSplitConfig();
    }
    localStorage.setItem(Constants.ZAP_SPLIT_CONFIG, JSON.stringify(this.zapSplitConfig))
  }

  async ngOnInit() {
    var language = localStorage.getItem(Constants.LANGUAGE);
    if (language != null && language != undefined && language != '') {
      this.currentLanguage = language as string;
      this.translate.use(this.currentLanguage || 'en')
    } else {
      this.currentLanguage = 'en';
    }
    var zapSplitConfigText = localStorage.getItem(Constants.ZAP_SPLIT_CONFIG);
    if (zapSplitConfigText !== null && zapSplitConfigText !== undefined && zapSplitConfigText !== '') {
      this.zapSplitConfig = JSON.parse(zapSplitConfigText!);
    } else {
      this.zapSplitConfig = ZapSplitUtil.prepareDefaultZapSplitConfig();
    }

    var mediaSettings = localStorage.getItem(Constants.SHOWMEDIA);
    if (mediaSettings != null && mediaSettings != undefined && mediaSettings != '') {
      this.loadContentFromPeopleIFollow = Boolean(JSON.parse(mediaSettings!));
    }
    var hideNonZapReactionsFromLocal = localStorage.getItem(Constants.HIDE_NONZAP_REACTIONS);
    if (hideNonZapReactionsFromLocal && hideNonZapReactionsFromLocal === 'true') {
      this.hideNonZapReactions = true;
    }
    var showUnapprovedPostsFromLocal = localStorage.getItem(Constants.SHOW_UNAPPROVED);
    if (showUnapprovedPostsFromLocal && showUnapprovedPostsFromLocal === 'true') {
      this.showUnapprovedPosts = true;
    }
    var defaultFeedIsCommunity = localStorage.getItem(Constants.DEFAULT_FEED_IS_COMMUNITY);
    if (defaultFeedIsCommunity && defaultFeedIsCommunity === 'true') {
      this.showCommunitiesFeedByDefault = true;
    }
    this.downzapRecipientInForm = this.ndkProvider.appData.downzapRecipients;
    this.ndkProvider.isLoggedInUsingPubKey$.subscribe(val => {
      Promise.resolve().then(() => {
        this.isLoggedInUsingPubKey = val;
        this.changeDetector.detectChanges();
      });
    });

    this.mutedTopics = this.ndkProvider.appData.mutedTopics.split(',').filter(i=>i!='');

    this.ndkProvider.mutedTopicsEmitter.subscribe(topics=>{
        this.mutedTopics = topics.split(',').filter(i=>i!='');
    })

    await this.getRelayList();
  }

  zapSplitPercentageChange(){
    localStorage.setItem(Constants.ZAP_SPLIT_CONFIG, ""+JSON.stringify(this.zapSplitConfig));
  }

  downZapRecipientChange(evt:any){
    const newValue = evt.target.value;
    console.log(newValue);
    this.downzapRecipientInForm = newValue;
    this.changeDetector.detectChanges();
  }

  copyPrivateKey() {
    const privateKeyHex = localStorage.getItem('privateKey');
    this.clipboard.copy(LoginUtil.hexToBech32('nsec', privateKeyHex!));
  }

  async saveDownzapRecipients() {
    this.downzapSetSuccessMessage = undefined;
    this.downzapRecipientsError = undefined;
    let recipients = (<HTMLInputElement>document.getElementById('downzap-recipients')).value;
    let supposedUser = await this.ndkProvider.getNdkUserFromNpub(recipients);
    if (supposedUser !== undefined) {
        this.ndkProvider.buildAndPublishDownzapRecipient([supposedUser.pubkey])
      this.downzapSetSuccessMessage =
        'Sending downzaps to ' +
        (supposedUser.profile?.displayName ? supposedUser.profile?.displayName : supposedUser.profile?.name);
    } else {
      this.downzapRecipientsError = 'Invalid npub';
    }

    var recipientsCleared = localStorage.getItem(Constants.RECIPIENTS_CLEARED) || "false";
    var data = await this.ndkProvider.fetchAppData()
    if(recipientsCleared === "false" || data.downzapRecipients !== ''){
      this.ndkProvider.publishAppData(data.hashtags.join(','),'',data.mutedHashtags,data.communities.join(','));
      localStorage.setItem(Constants.RECIPIENTS_CLEARED, "true")
    }
  }

  setDefaultSats() {
    this.settingDefaultSats = true;
    let sats = (<HTMLInputElement>document.getElementById('sats-for-zaps')).value;
    try {
      this.ndkProvider.setDefaultSatsForZaps(Number.parseInt(sats));
    } catch (e) {
      console.error(e);
    } finally {
      this.settingDefaultSats = false;
    }
  }

  muteTopic() {
    this.mutingTopic = true;
    let topic = (<HTMLInputElement>document.getElementById('topic-to-mute')).value;
    if (topic.startsWith('#')) {
      topic = topic.slice(1);
    }
    try {
      if(this.ndkProvider.isTryingZapddit){
        this.topicService.muteTryZapddit(topic);
        return;
      }

      this.topicService.muteTopic(topic);
    } catch (e) {
      console.error(e);
    } finally {
      this.mutingTopic = false;
    }
  }

  unmuteTopic(topic: string) {
    try {
      if(this.ndkProvider.isTryingZapddit){
        this.topicService.unmuteTryZapddit(topic);
        return;
      }

      this.topicService.unmuteTopic(topic);
    } catch (e) {
      console.error(e);
    }
  }

  onMediaSettingChange(checked: any) {
    localStorage.setItem(Constants.SHOWMEDIA, checked);
  }

  onHideNonZapChange(checked: any) {
    localStorage.setItem(Constants.HIDE_NONZAP_REACTIONS, checked);
  }

  onShowUnapprovedChange(checked: any) {
    localStorage.setItem(Constants.SHOW_UNAPPROVED, checked);
  }

  onDefaultFeedChange(checked: any){
    localStorage.setItem(Constants.DEFAULT_FEED_IS_COMMUNITY, checked);
  }

  async getRelayList() {
    this.relays = await Promise.resolve(this.relayService.getRelays());
    //console.log(`ngOnInit relayUrls: ${this.relayUrls.join(',')}`);
  }

  async removeRelay(relay: string) {
    await this.relayService.removeRelay(relay);
    this.relays = await Promise.resolve(this.relayService.getRelays());
  }

  async addRelay() {
    this.addingRelay = true;
    const relay = (<HTMLInputElement>document.getElementById('relay-to-add')).value;
    const read = (<HTMLInputElement>document.getElementById('relay-read')).checked;
    const write = (<HTMLInputElement>document.getElementById('relay-write')).checked;

    try {
      // console.log(relay);
      // console.log(`read: ${read}`);
      // console.log(`write: ${write}`);
      await this.relayService.addRelay(relay, read, write);
    } catch (e) {
      console.log('error');
      console.error(e);
    } finally {
      this.relays = await Promise.resolve(this.relayService.getRelays());
      this.addingRelay = false;
    }
  }
}
