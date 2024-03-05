import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileComponent } from './profile.component';
import { CommonTestingModule } from 'src/app/testing/CommonTestingModule';
import { TranslateModule } from '@ngx-translate/core';
import { ZappeditdbService } from 'src/app/service/zappeditdb.service';
import Dexie from 'dexie';
import { indexedDB, IDBKeyRange } from "fake-indexeddb";


xdescribe('ProfileComponent', () => {
  CommonTestingModule.setUpTestBed(ProfileComponent)

  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  class MockDbService extends Dexie{
    constructor(){
      super("MyDatabase", { indexedDB: indexedDB, IDBKeyRange: IDBKeyRange })
    }

  } 


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProfileComponent ],
      imports: [TranslateModule.forRoot()],
      providers:[{provide:ZappeditdbService,
        useClass:MockDbService
      }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
