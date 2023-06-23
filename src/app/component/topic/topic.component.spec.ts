import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopicComponent } from './topic.component';

describe('TopicComponent', () => {
  let component: TopicComponent;
  let fixture: ComponentFixture<TopicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TopicComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
