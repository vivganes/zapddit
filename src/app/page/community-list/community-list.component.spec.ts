import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityListComponent } from './community-list.component';

describe('CommunityListComponent', () => {
  let component: CommunityListComponent;
  let fixture: ComponentFixture<CommunityListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommunityListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommunityListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
