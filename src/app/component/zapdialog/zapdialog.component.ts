import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, Renderer2, OnInit, ChangeDetectorRef } from '@angular/core';
import { Observable } from 'rxjs';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import QRCodeStyling from 'qr-code-styling';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-zapdialog',
  templateUrl: './zapdialog.component.html',
  styleUrls: ['./zapdialog.component.scss']
})
export class ZapdialogComponent implements OnInit {

  @Input()
  authorName:string | undefined;

  @Input()
  imageUrl:string | undefined;

  @Input()
  show:boolean = false;

  @Input()
  noteId:string|undefined;

  @Input()
  type:string | undefined;

  @Input()
  authorNpub:string|undefined;

  @Output()
  onClose = new EventEmitter<boolean>();

  @Output()
  onUpzapDone = new EventEmitter<boolean>();

  zapValue:number = 21;
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
  }

  async initiateZap(){
    if(this.type==='upzap'){
      await this.upZap();
    }else{
      await this.downZap();
    }
  }

  async upZap() {
    this.zappingNow = true;
    try{
        if (this.event) {
        if(this.canvas && this.canvas?.nativeElement)
          this.renderer.setProperty(this.canvas?.nativeElement, 'innerHTML', '');
        const invoice = await this.ndkProvider.zapRequest(this.event!);
        const qr = new QRCodeStyling({
          width:  256,
          height:  256,
          data: invoice?invoice:undefined,
          margin: 5,
          type: "canvas",
          dotsOptions: {
            type: "rounded",
          },
          cornersSquareOptions: {
            type: "extra-rounded",
          }
        });
        this.showQR=true;
        setTimeout(()=>
        qr.append(this.canvas?.nativeElement),1000);
        this.invoice = invoice;
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
        const invoice = await this.ndkProvider.downZapRequest(
            this.event,
            await this.ndkProvider.getNdkUserFromNpub(this.ndkProvider.appData.downzapRecipients),
            '-'
          );
          const qr = new QRCodeStyling({
            width:  256,
            height:  256,
            data: invoice?invoice:undefined,
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
          setTimeout(()=>
            qr.append(this.canvas?.nativeElement),1000);
          this.invoice = invoice;
      }
    }catch(e:any){
      this.errorMsg = e.message;
    }finally{
      this.zappingNow = false;
    }
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
