import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeopleIFollowComponent } from './peopleifollow.component';
import { TranslateModule } from '@ngx-translate/core';

describe('PeopleIFollowComponent', () => {
  let component: PeopleIFollowComponent;
  let fixture: ComponentFixture<PeopleIFollowComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PeopleIFollowComponent],
      imports:[TranslateModule.forRoot()]
    });
    fixture = TestBed.createComponent(PeopleIFollowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
