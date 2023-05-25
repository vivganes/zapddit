import { Component } from '@angular/core';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import { LoginUtil } from 'src/app/util/LoginUtil';

const HASHTAG_REGEX=/(#[^\s!@#$%^&*()=+.\/,\[{\]};:'"?><]+)/gi;
const NOSTR_NPUB_REGEX = /nostr:(npub[\S]*)/gi;


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
    let hashTags = this.getHashTagsFromText(noteText);
    let userMentions = this.getUserMentionsFromText(noteText);
    if(userMentions.length > 0){
      
    }
    this.ndkProvider.sendNote(noteText,hashTags,userMentions);
  }

  getHashTagsFromText(text:string){
    const hashTagMatches= [...text.matchAll(HASHTAG_REGEX)];
    return hashTagMatches.map(hashTag => {
      return hashTag[0].slice(1);
    });
  }

  getUserMentionsFromText(text:string){
    const userMentionMatches = [...text.matchAll(NOSTR_NPUB_REGEX)];
    return userMentionMatches.map(userMention => {
      return LoginUtil.bech32ToHex(userMention[1])
    });
  }

}
