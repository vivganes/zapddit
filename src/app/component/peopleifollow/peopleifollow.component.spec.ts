import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeopleIFollowComponent } from './peopleifollow.component';

describe('PeopleIFollowComponent', () => {
  let component: PeopleIFollowComponent;
  let fixture: ComponentFixture<PeopleIFollowComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PeopleIFollowComponent]
    });
    fixture = TestBed.createComponent(PeopleIFollowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
