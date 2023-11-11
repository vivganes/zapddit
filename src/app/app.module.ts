import { ClipboardModule } from '@angular/cdk/clipboard';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LayoutModule } from '@angular/cdk/layout';
import "@getalby/bitcoin-connect";
// import ngx-translate and the http loader
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {HttpClient, HttpClientModule} from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClarityModule } from '@clr/angular';
import { MentionModule } from 'angular-mentions';

import { UserprofileComponent } from './component/userprofile/userprofile.component';
import { EventFeedComponent } from './component/event-feed/event-feed.component';
import { EventCardComponent } from './component/event-card/event-card.component';
import { SinglePostComponent } from './component/single-post/single-post.component';
import { ShortNumberPipe } from './pipe/short-number.pipe';
import { HashtagComponent } from './component/hashtag/hashtag.component';
import { DynamicHooksModule, HookParserEntry } from 'ngx-dynamic-hooks';
import { PreferencesPageComponent } from './component/preferences-page/preferences-page.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { LoginPageComponent } from './page/login-page/login-page.component';
import { PeopleIFollowComponent } from './component/peopleifollow/peopleifollow.component';
import { UserMentionComponent } from './component/user-mention/user-mention.component';
import { QuotedEventComponent } from './component/quoted-event/quoted-event.component';
import { NoteComposerComponent } from './component/note-composer/note-composer.component';
import { ContactCardComponent } from './component/contact-card/contact-card.component';
import { formatTimestampPipe } from './pipe/formatTimeStamp.pipe';
import { OnboardingWizardComponent } from './component/onboarding-wizard/onboarding-wizard.component';
import { ImageLoaderDirective } from './directive/ImageLoaderDirective';
import { ProfileComponent } from './component/profile/profile.component';
import { AbbreviateIdPipe } from './pipe/abbreviateId.pipe';
import { TopicComponent } from './component/topic/topic.component';
import { CommunityCardComponent } from './component/community-card/community-card.component';
import { ZapdialogComponent } from './component/zapdialog/zapdialog.component';
import { CommunityListComponent } from './page/community-list/community-list.component';
import { HashTagFilter } from './filter/HashTagFilter';
import { UserPicAndNameComponent } from './component/user-pic-and-name/user-pic-and-name.component';
import { CreateCommunityComponent } from './component/create-community/create-community.component';
import { NewLineToBrPipe } from './pipe/newLineToBr.pipe';
import { InViewportModule } from 'ng-in-viewport';
const componentParsers: Array<HookParserEntry> = [
  {component: HashtagComponent},
  {component: UserMentionComponent},
  {component: QuotedEventComponent}
  // ...
];

@NgModule({
  declarations: [
    AppComponent,
    UserprofileComponent,
    EventFeedComponent,
    EventCardComponent,
    SinglePostComponent,
    ShortNumberPipe,
    formatTimestampPipe,
    AbbreviateIdPipe,
    NewLineToBrPipe,
    HashtagComponent,
    PreferencesPageComponent,
    LoginPageComponent,
    PeopleIFollowComponent,
    UserMentionComponent,
    QuotedEventComponent,
    NoteComposerComponent,
    ContactCardComponent,
    OnboardingWizardComponent,
    ImageLoaderDirective,
    ProfileComponent,
    TopicComponent,
    CommunityListComponent,
    CommunityCardComponent,
    ZapdialogComponent,
    UserPicAndNameComponent,
    CreateCommunityComponent
  ],
  imports: [DynamicHooksModule.forRoot({
    globalParsers: componentParsers
  }), 
  BrowserModule,
  // ngx-translate and the loader module
  HttpClientModule,
  TranslateModule.forRoot({
      loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
      }
  }), 
  InViewportModule, LayoutModule, FormsModule, ReactiveFormsModule, MentionModule, AppRoutingModule, BrowserAnimationsModule, ClarityModule, ClipboardModule, ServiceWorkerModule.register('ngsw-worker.js', {
  enabled: !isDevMode(),
  // Register the ServiceWorker as soon as the application is stable
  // or after 30 seconds (whichever comes first).
  registrationStrategy: 'registerWhenStable:30000'
})],
  providers: [],
  bootstrap: [AppComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}

// required for AOT compilation
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http);
}
