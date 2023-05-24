import { Component, Input } from '@angular/core';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import { LoginUtil } from 'src/app/util/LoginUtil';

@Component({
  selector: 'app-quoted-event',
  templateUrl: './quoted-event.component.html',
  styleUrls: ['./quoted-event.component.scss']
})
export class QuotedEventComponent {

  event?:NDKEvent

  @Input()
  id?:string

  constructor(private ndkProvider: NdkproviderService){
  }

  ngOnInit(){
    if(this.id){
      this.getNote(this.id);
    }
  }

  async getNote(id:string){   
    const bech32Id = LoginUtil.bech32ToHex(id);
    this.event= await this.ndkProvider.fetchEventFromId(bech32Id)    
  }
}
