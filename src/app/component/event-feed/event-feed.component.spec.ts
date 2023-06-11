import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventFeedComponent } from './event-feed.component';
import { CommonTestingModule } from 'src/app/testing/CommonTestingModule';

describe('EventFeedComponent', () => {
  CommonTestingModule.setUpTestBed(EventFeedComponent)

  let component: EventFeedComponent;
  let fixture: ComponentFixture<EventFeedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EventFeedComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EventFeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
