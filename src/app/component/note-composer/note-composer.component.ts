import { Component } from '@angular/core';
import { Observable, Subject, debounceTime, filter, from, of, switchMap } from 'rxjs';
import { User } from 'src/app/model/user';
import { NdkproviderService } from 'src/app/service/ndkprovider.service';
import { LoginUtil } from 'src/app/util/LoginUtil';
import { ZappeditdbService } from '../../service/zappeditdb.service';

const HASHTAG_REGEX=/(#[^\s!@#$%^&*()=+.\/,\[{\]};:'"?><]+)/gi;
const NOSTR_NPUB_REGEX = /nostr:(npub[\S]*)/gi;

@Component({
  selector: 'app-note-composer',
  templateUrl: './note-composer.component.html',
  styleUrls: ['./note-composer.component.scss']
})

export class NoteComposerComponent {

  isSendingNote:boolean = false;
  noteSent:boolean = false;
  searchResults$: Observable<any[]> = of([]);
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
    console.log('getItems:', term);
    if (!term) {
      // if the search term is empty, return an empty array
      return of([]);
    }
    // return this.http.get('api/names') // get all names
    return from(this.findUsersFromFewLetters(term)); // get filtered names
  }

  doSearch(term: string) {
    console.log(term);
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
    console.log(usersFromCache)
    let filteredUsersFromCache = usersFromCache.filter((user:User)=>{
      return user.displayName?.toLocaleLowerCase().startsWith(term)
      || user.name?.toLocaleLowerCase().startsWith(term) 
      || user.npub?.toLocaleLowerCase().startsWith(term)
    })
    console.log(filteredUsersFromCache)
    return filteredUsersFromCache;
  }

  async sendNote(){
    this.isSendingNote = true;
    let noteText = (<HTMLTextAreaElement>document.getElementById('note-text')).value;
    console.log(noteText);
    let hashTags = this.getHashTagsFromText(noteText);
    let userMentions = this.getUserMentionsFromText(noteText);
    if(userMentions.length > 0){
      
    }
    await this.ndkProvider.sendNote(noteText,hashTags,userMentions);
    this.isSendingNote = false;
    (<HTMLTextAreaElement>document.getElementById('note-text')).value='';
    this.noteSent =true;

      setTimeout(()=>{
        this.noteSent = false;
      }, 3000)

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
