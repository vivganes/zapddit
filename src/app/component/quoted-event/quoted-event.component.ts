import { Component, Input } from '@angular/core';
import { treeFeaturesFactory } from '@clr/angular/data/tree-view/tree-features.service';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import { LoginUtil } from 'src/app/util/LoginUtil';

@Component({
  selector: 'app-quoted-event',
  templateUrl: './quoted-event.component.html',
  styleUrls: ['./quoted-event.component.scss']
})
export class QuotedEventComponent {

  event?:NDKEvent|null
  loading:boolean = true;

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
    this.loading = true;
    let bech32Id = '';
    if(id.startsWith('nevent')){
      let decodedValue  = LoginUtil.decodeTLV(id);
      bech32Id = (decodedValue[0].value as string);
    } else {
      bech32Id = LoginUtil.bech32ToHex(id);
    }
    let fetchedEvent = await this.ndkProvider.fetchEventFromId(bech32Id)    
    if(fetchedEvent?.kind == 1){
      this.event = fetchedEvent;
    } 
    this.loading = false;
  }
}
