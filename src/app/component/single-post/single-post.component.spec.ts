import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SinglePostComponent } from './single-post.component';
import { ActivatedRoute } from '@angular/router';
import { MockActivatedRoute } from 'src/app/testing/mock-active-router';

describe('SinglePostComponent', () => {
  let component: SinglePostComponent;
  let fixture: ComponentFixture<SinglePostComponent>;

  beforeEach(async () => {
    const activatedRouteStub = new MockActivatedRoute();
    await TestBed.configureTestingModule({
      declarations: [SinglePostComponent],
      providers:
      [
        {
          provide: ActivatedRoute,
          useValue:  activatedRouteStub
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SinglePostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
