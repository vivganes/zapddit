import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nip07LoginComponent } from './nip07-login.component';

describe('Nip07LoginComponent', () => {
  let component: Nip07LoginComponent;
  let fixture: ComponentFixture<Nip07LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Nip07LoginComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Nip07LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
