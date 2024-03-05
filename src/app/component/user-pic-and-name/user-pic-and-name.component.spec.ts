import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserPicAndNameComponent } from './user-pic-and-name.component';

describe('UserPicAndNameComponent', () => {
  let component: UserPicAndNameComponent;
  let fixture: ComponentFixture<UserPicAndNameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserPicAndNameComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserPicAndNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
