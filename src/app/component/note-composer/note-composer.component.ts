import { Component } from '@angular/core';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';

@Component({
  selector: 'app-note-composer',
  templateUrl: './note-composer.component.html',
  styleUrls: ['./note-composer.component.scss']
})
export class NoteComposerComponent {

  isSendingNote:boolean = false;


  constructor(private ndkProvider: NdkproviderService){

  }

  sendNote(){
    let noteText = (<HTMLTextAreaElement>document.getElementById('note-text')).value;
    console.log(noteText);
    this.ndkProvider.sendNote(noteText);
  }

}
