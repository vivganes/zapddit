import { Component } from '@angular/core';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';

@Component({
  selector: 'app-preferences-page',
  templateUrl: './preferences-page.component.html',
  styleUrls: ['./preferences-page.component.scss']
})
export class PreferencesPageComponent {

  downzapRecipientsError: string | undefined;
  downzapSetSuccessMessage: string | undefined;

  ndkProvider: NdkproviderService;
  settingDefaultSats:boolean = false;

  constructor(ndkProvider: NdkproviderService) {
    this.ndkProvider = ndkProvider;
  }


  async saveDownzapRecipients() {
    this.downzapSetSuccessMessage = undefined;
    this.downzapRecipientsError = undefined;
    let recipients = (<HTMLInputElement>document.getElementById('downzap-recipients')).value;
    let supposedUser = await this.ndkProvider.getNdkUserFromNpub(recipients);
    console.log(supposedUser)
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

}
