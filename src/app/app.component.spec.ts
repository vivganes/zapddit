import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { ClarityModule } from '@clr/angular';
import { CommonTestingModule } from './testing/CommonTestingModule';
import { TranslateModule } from '@ngx-translate/core';

describe('AppComponent', () => {
  CommonTestingModule.setUpTestBed(AppComponent)

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule,ClarityModule, 
      TranslateModule.forRoot()],
      declarations: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges()
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it("should have as title 'zapddit'", () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges()
    const app = fixture.componentInstance;
    expect(app.title).toEqual('zapddit');
  });
});
