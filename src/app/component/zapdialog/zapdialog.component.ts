import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, Renderer2, OnInit, ChangeDetectorRef } from '@angular/core';
import { Observable } from 'rxjs';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import QRCodeStyling from 'qr-code-styling';
import { Clipboard } from '@angular/cdk/clipboard';
import { Constants } from 'src/app/util/Constants';
import { Community } from 'src/app/model/community';

@Component({
  selector: 'app-zapdialog',
  templateUrl: './zapdialog.component.html',
  styleUrls: ['./zapdialog.component.scss']
})
export class ZapdialogComponent implements OnInit {

  @Input()
  eventHexId?:string;

  @Input()
  authorName:string | undefined;

  @Input()
  imageUrl:string | undefined;

  @Input()
  show:boolean = false;

  @Input()
  type:string | undefined;

  @Input()
  authorNpub:string|undefined;

  @Input()
  community?:Community;

  @Output()
  onClose = new EventEmitter<boolean>();

  @Output()
  onUpzapDone = new EventEmitter<boolean>();

  zapValue:number = 1;
  disableZap :boolean =false;
  showQR:boolean = false;
  @ViewChild("canvas")
  canvas: ElementRef | undefined;
  invoice:string|null=null;
  errorMsg:string | null = null;
  zappingNow:boolean = false;

  @Input()
  event:NDKEvent|undefined;

  constructor(private renderer: Renderer2,private ndkProvider: NdkproviderService,
              private clipboard: Clipboard) {

  }

  ngOnInit(): void {
    this.showQR = false;
    const satsFromLocalStorage = localStorage.getItem(Constants.DEFAULTSATSFORZAPS);
      if (satsFromLocalStorage) {
        try {
          this.zapValue = Number.parseInt(satsFromLocalStorage);
        } catch (e) {
          console.error(e);
        }
      }
  }

  async initiateZap(){
    if(this.event){
      this.event.id = this.eventHexId!;
    }
    if(this.community){
      await this.zapCommunityMods();
    } else {
      if(this.type==='upzap'){
        await this.upZap();
      }else{
        await this.downZap();
      }
    }    
  }

  async upZap() {
    this.zappingNow = true;
    try{
        if (this.event) {
        if(this.canvas && this.canvas?.nativeElement)
          this.renderer.setProperty(this.canvas?.nativeElement, 'innerHTML', '');
        const invoice = await this.ndkProvider.zapRequest(this.zapValue, this.event!);
        this.invoice = invoice;
        if(window.hasOwnProperty('webln')){
          //@ts-ignore
          if(window.webln.connected){
            //@ts-ignore
            const result = await window.webln.sendPayment(this.invoice);
            if(!result?.preimage) {
              throw new Error('Payment failed. Please try again');
            } else {
              this.zapDoneClicked();
            }
            return;
          }
        }
        this.openQRDialog(invoice);
      }
    }catch(e:any){
      this.errorMsg = e.message;
    }finally{
      this.zappingNow = false;
    }
  }

  async downZap() {
    this.zappingNow = true;
    try{
      if (this.event) {
        if(this.canvas && this.canvas?.nativeElement)
          this.renderer.setProperty(this.canvas?.nativeElement, 'innerHTML', '');
        const invoice = await this.ndkProvider.downZapRequest(this.zapValue,
            this.event,
            await this.ndkProvider.getNdkUserFromNpub(this.ndkProvider.appData.downzapRecipients),
            '-'
          );
          this.invoice = invoice;
          if(window.hasOwnProperty('webln')){
            //@ts-ignore
            if(window.webln.connected){
              //@ts-ignore
              const result = await window.webln.sendPayment(this.invoice);
              if(!result?.preimage) {
                throw new Error('Payment failed. Please try again');
              } else {
                this.zapDoneClicked();
              }
              return;
            }
          }
          this.openQRDialog(invoice);
      }
    }catch(e:any){
      this.errorMsg = e.message;
    }finally{
      this.zappingNow = false;
    }
  }

  async zapCommunityMods(){
    const zapValue = this.zapValue;
    const mods = this.community?.moderatorHexKeys;
    if(mods){
      for (const mod of mods){
        try{
          const modUser = this.ndkProvider.ndk?.getUser({pubkey: mod})
          const invoice = await modUser?.zap((zapValue*1000)/mods.length,'Great job with n/'+this.community?.name,[],this.ndkProvider.ndk?.signer)
          if(window.hasOwnProperty('webln')){
            //@ts-ignore
            if(window.webln.connected){
              //@ts-ignore
              const result = await window.webln.sendPayment(invoice);
              if(!result?.preimage) {
                throw new Error('Payment failed for '+modUser?.profile?.name+'. Please try again');
              }
            }
          } 
        }catch(e){
          console.error(e);
        }         
      }
      this.zapDoneClicked();
    }
  }

  private openQRDialog(invoice: any) {
    const qr = new QRCodeStyling({
      width: 256,
      height: 256,
      data: invoice ? invoice : undefined,
      margin: 5,
      type: "canvas",
      dotsOptions: {
        type: "rounded",
      },
      cornersSquareOptions: {
        type: "extra-rounded",
      }
    });
    this.showQR = true;
    setTimeout(() => qr.append(this.canvas?.nativeElement), 1000);
  }

  zapValueChange(event:any){
    if(event===null || event===undefined){
      this.disableZap = true;
    }else{
      this.disableZap = false;
    }
  }

  close(value: boolean) {
    this.onChange(value);
  }

  onChange(event:any){
    this.show=false;
    this.onClose.emit(true);
  }

  setSats(sats:number){
    this.zapValue = sats;
    this.zapValueChange(sats);
  }

  openWallet(){
    window.open(`lightning:${this.invoice}`,"_blank");
  }

  copyInvoiceToClipboard(){
    this.clipboard.copy(this.invoice!);
  }

  zapDoneClicked(){
    this.showQR = false;
    this.zapValue = 0;
    this.onClose.emit(true);
    this.onUpzapDone.emit(true);
  }
}
