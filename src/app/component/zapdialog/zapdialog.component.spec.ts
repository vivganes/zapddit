import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZapdialogComponent } from './zapdialog.component';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

describe('ZapdialogComponent', () => {
  let component: ZapdialogComponent;
  let fixture: ComponentFixture<ZapdialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ZapdialogComponent ],
      schemas:[CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      imports:[TranslateModule.forRoot()]
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
