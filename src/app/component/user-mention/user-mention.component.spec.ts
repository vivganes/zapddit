import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserMentionComponent } from './user-mention.component';

describe('UserMentionComponent', () => {
  let component: UserMentionComponent;
  let fixture: ComponentFixture<UserMentionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserMentionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserMentionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
