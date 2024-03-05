import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnboardingWizardComponent } from './onboarding-wizard.component';
import { CommonTestingModule } from 'src/app/testing/CommonTestingModule';
import { TranslateModule } from '@ngx-translate/core';

describe('OnboardingWizardComponent', () => {
  CommonTestingModule.setUpTestBed(OnboardingWizardComponent)

  let component: OnboardingWizardComponent;
  let fixture: ComponentFixture<OnboardingWizardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OnboardingWizardComponent ],
      imports: [TranslateModule.forRoot()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OnboardingWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
