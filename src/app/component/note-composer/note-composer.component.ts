import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Observable, Subject, debounceTime, filter, from, of, switchMap } from 'rxjs';
import { User } from 'src/app/model/user';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import { LoginUtil } from 'src/app/util/LoginUtil';
import { ZappeditdbService } from '../../service/zappeditdb.service';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import Uploader from 'src/app/util/Uploader';

const HASHTAG_REGEX=/(#[^\s!@#$%^&*()=+.\/,\[{\]};:'"?><]+)/gi;
const NOSTR_NPUB_REGEX = /nostr:(npub[\S]*)/gi;

const NOSTR_NOTE_REGEX = /nostr:(note1[\S]*)/gi;


@Component({
  selector: 'app-note-composer',
  templateUrl: './note-composer.component.html',
  styleUrls: ['./note-composer.component.scss']
})

export class NoteComposerComponent {

  @Input()
  isReply:boolean = false;

  @Input()
  parentEvent?:NDKEvent;

  @Input()
  currentTag?:string;
  
  @Output()
  postedEventEmitter:  EventEmitter<NDKEvent> = new EventEmitter<NDKEvent>();

  @ViewChild('noteText') 
  noteText?: ElementRef<HTMLInputElement>;
  isSendingNote:boolean = false;
  noteSent:boolean = false;
  searchResults$: Observable<any[]> = of([]);
  uploadingNow: boolean = false;
  uploadError?: string;
  private searchTermStream = new Subject<string>();

  constructor(private ndkProvider: NdkproviderService, private db: ZappeditdbService){

  }

  ngOnInit() {
    this.searchTermStream
      .subscribe((value:string) => {
        this.searchResults$ = this.getItems(value);
      },(err:any)=> console.error(err));
  }

  getItems(term:string): Observable<User[]> {
    if (!term) {
      // if the search term is empty, return an empty array
      return of([]);
    }
    // return this.http.get('api/names') // get all names
    return from(this.findUsersFromFewLetters(term)); // get filtered names
  }

  doSearch(term: string) {
    this.searchTermStream.next(term);
  }

  formatSelectedUser(user: User){
    return "nostr:"+user.npub+" ";
  }

  async findUsersFromFewLetters(term: string): Promise<User[]> {
    if (!term) {
      return [];
    }
    let usersFromCache = await this.db.peopleIFollow.toArray()
    let filteredUsersFromCache = usersFromCache.filter((user:User)=>{
      return user.displayName?.toLocaleLowerCase().startsWith(term)
      || user.name?.toLocaleLowerCase().startsWith(term) 
      || user.npub?.toLocaleLowerCase().startsWith(term)
    })
    return filteredUsersFromCache;
  }

  async sendNote(){
    this.isSendingNote = true;
    let noteText =this.noteText?.nativeElement.value;
    if(noteText){
    let hashTags = this.getHashTagsFromText(noteText);
    let userMentions = this.getUserMentionsFromText(noteText); 
    let noteMentions = this.getNoteMentionsFromText(noteText);
    let postedEvent = await this.ndkProvider.sendNote(noteText,hashTags,userMentions,noteMentions,this.parentEvent);
    this.isSendingNote = false;
    this.postedEventEmitter.emit(postedEvent);
    if(this.noteText){
      this.noteText.nativeElement.value= this.currentTag? '#'+this.currentTag+' ' : '';
    }
    this.noteSent =true;
      setTimeout(()=>{
        this.noteSent = false;
      }, 3000)
    }
  }

  async attachFile() {
    try {
      this.uploadingNow = true;
      const file = await this.openFile();
      if (file) {
        this.uploadFile(file);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error)
        this.uploadError = error.message;
      }
    } finally{
      this.uploadingNow = false;
    }
  }

  async uploadFile(file: File | Blob) {
    try {
      if (file) {
        const uploaderResponse = await Uploader.upload(file);
        if (uploaderResponse.url) {
          if(this.noteText){
            this.noteText.nativeElement.value += '\n '+uploaderResponse.url;
          }
        } else if (uploaderResponse?.error) {
          this.uploadError = uploaderResponse?.error;

        }
      }
    } catch (error) {
      if (error instanceof Error) {
        this.uploadError = error.message;
      }
    }
  }

  async openFile(): Promise<File | undefined> {
    return new Promise(resolve => {
      const newElement = document.createElement("input");
      newElement.type = "file";
      newElement.accept = "image/*";
      newElement.onchange = (e: Event) => {
        const currentElement = e.target as HTMLInputElement;
        if (currentElement.files) {
          resolve(currentElement.files[0]);
        } else {
          resolve(undefined);
        }
      };
      newElement.click();
    });
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

  getNoteMentionsFromText(text:string){
    const noteMentionMatches = [...text.matchAll(NOSTR_NOTE_REGEX)];
    return noteMentionMatches.map(noteMention => {
      return LoginUtil.bech32ToHex(noteMention[1])
    });
  }

}
