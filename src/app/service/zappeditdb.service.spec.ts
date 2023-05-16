import { TestBed } from '@angular/core/testing';

import { ZappeditdbService } from './zappeditdb.service';

describe('ZappeditdbService', () => {
  let service: ZappeditdbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZappeditdbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
