import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityCardComponent } from './community-card.component';

describe('CommunityCardComponent', () => {
  let component: CommunityCardComponent;
  let fixture: ComponentFixture<CommunityCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommunityCardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommunityCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
