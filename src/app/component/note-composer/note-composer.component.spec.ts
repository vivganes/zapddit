import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteComposerComponent } from './note-composer.component';

describe('NoteComposerComponent', () => {
  let component: NoteComposerComponent;
  let fixture: ComponentFixture<NoteComposerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NoteComposerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoteComposerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
