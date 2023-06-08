import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventCardComponent } from './event-card.component';
import { CommonTestingModule } from 'src/app/testing/CommonTestingModule';
import { ShortNumberPipe } from 'src/app/pipe/short-number.pipe';
import { formatTimestampPipe } from 'src/app/pipe/formatTimeStamp.pipe';

describe('EventCardComponent', () => {

  CommonTestingModule.setUpTestBed(EventCardComponent)

  let component: EventCardComponent;
  let fixture: ComponentFixture<EventCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EventCardComponent,
        ShortNumberPipe,
        formatTimestampPipe],
    }).compileComponents();

    fixture = TestBed.createComponent(EventCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
