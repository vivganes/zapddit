import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnboardingWizardComponent } from './onboarding-wizard.component';
import { CommonTestingModule } from 'src/app/testing/CommonTestingModule';

describe('OnboardingWizardComponent', () => {
  CommonTestingModule.setUpTestBed(OnboardingWizardComponent)

  let component: OnboardingWizardComponent;
  let fixture: ComponentFixture<OnboardingWizardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OnboardingWizardComponent ]
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
