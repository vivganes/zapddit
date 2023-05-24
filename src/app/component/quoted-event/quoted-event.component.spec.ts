import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuotedEventComponent } from './quoted-event.component';

describe('QuotedEventComponent', () => {
  let component: QuotedEventComponent;
  let fixture: ComponentFixture<QuotedEventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuotedEventComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuotedEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
