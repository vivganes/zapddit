import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { DynamicHooksModule, HookParserEntry } from 'ngx-dynamic-hooks';
import { HashtagComponent } from '../component/hashtag/hashtag.component';
import { UserMentionComponent } from '../component/user-mention/user-mention.component';
import { QuotedEventComponent } from '../component/quoted-event/quoted-event.component';
import { BrowserModule } from '@angular/platform-browser';
import { MentionModule } from 'angular-mentions';
import { AppRoutingModule } from '../app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClarityModule } from '@clr/angular';
import { DatePipe } from '@angular/common';
import { ImageCardComponent } from '../component/image-card/image-card.component';

const componentParsers: Array<HookParserEntry> = [
  { component: HashtagComponent },
  { component: UserMentionComponent },
  { component: QuotedEventComponent },
  { component: ImageCardComponent},
  // ...
];

@NgModule({
  declarations: [],
})
export class CommonTestingModule {
  public static setUpTestBed = (TestingComponent: any) => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          ReactiveFormsModule,
          FormsModule,
          RouterTestingModule,
          DynamicHooksModule.forRoot({
            globalParsers: componentParsers,
          }),
          BrowserModule,
          FormsModule,
          MentionModule,
          AppRoutingModule,
          BrowserAnimationsModule,
          ClarityModule,
        ],
        providers: [DatePipe],
        declarations: [TestingComponent],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      });
    });
  };
}
