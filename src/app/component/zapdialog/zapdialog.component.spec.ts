import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZapdialogComponent } from './zapdialog.component';

describe('ZapdialogComponent', () => {
  let component: ZapdialogComponent;
  let fixture: ComponentFixture<ZapdialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ZapdialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZapdialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
