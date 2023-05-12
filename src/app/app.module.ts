import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClarityModule } from '@clr/angular';
import { UserprofileComponent } from './component/userprofile/userprofile.component';
import { Nip07LoginComponent } from './component/nip07-login/nip07-login.component';
import { EventFeedComponent } from './component/event-feed/event-feed.component';
import { EventCardComponent } from './component/event-card/event-card.component';
import { SinglePostComponent } from './component/single-post/single-post.component';
import { ShortNumberPipe } from './pipe/short-number.pipe';
import { HashtagComponent } from './component/hashtag/hashtag.component';
import { DynamicHooksModule, HookParserEntry } from 'ngx-dynamic-hooks';
import { PreferencesPageComponent } from './component/preferences-page/preferences-page.component';
import { ServiceWorkerModule } from '@angular/service-worker';

const componentParsers: Array<HookParserEntry> = [
  {component: HashtagComponent},
  // ...
];

@NgModule({
  declarations: [
    AppComponent,
    UserprofileComponent,
    Nip07LoginComponent,
    EventFeedComponent,
    EventCardComponent,
    SinglePostComponent,
    ShortNumberPipe,
    HashtagComponent,
    PreferencesPageComponent
  ],
  imports: [DynamicHooksModule.forRoot({
    globalParsers: componentParsers
  }),BrowserModule, AppRoutingModule, BrowserAnimationsModule, ClarityModule, ServiceWorkerModule.register('ngsw-worker.js', {
  enabled: !isDevMode(),
  // Register the ServiceWorker as soon as the application is stable
  // or after 30 seconds (whichever comes first).
  registrationStrategy: 'registerWhenStable:30000'
})],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
