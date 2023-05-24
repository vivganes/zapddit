import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClarityModule } from '@clr/angular';
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
    HashtagComponent,
    PreferencesPageComponent,
    LoginPageComponent,
    PeopleIFollowComponent,
    UserMentionComponent,
    QuotedEventComponent
  ],
  imports: [DynamicHooksModule.forRoot({
    globalParsers: componentParsers
  }),FormsModule, BrowserModule, AppRoutingModule, BrowserAnimationsModule, ClarityModule, ServiceWorkerModule.register('ngsw-worker.js', {
  enabled: !isDevMode(),
  // Register the ServiceWorker as soon as the application is stable
  // or after 30 seconds (whichever comes first).
  registrationStrategy: 'registerWhenStable:30000'
})],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
