import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventFeedComponent } from './event-feed.component';
import { CommonTestingModule } from 'src/app/testing/CommonTestingModule';
import { TranslateModule } from '@ngx-translate/core';
import { AbbreviateIdPipe } from 'src/app/pipe/abbreviateId.pipe';
import { NewLineToBrPipe } from 'src/app/pipe/newLineToBr.pipe';

describe('EventFeedComponent', () => {
  CommonTestingModule.setUpTestBed(EventFeedComponent)

  let component: EventFeedComponent;
  let fixture: ComponentFixture<EventFeedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EventFeedComponent, AbbreviateIdPipe, NewLineToBrPipe],
      imports: [TranslateModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EventFeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
