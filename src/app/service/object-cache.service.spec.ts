import { TestBed } from '@angular/core/testing';

import { ObjectCacheService } from './object-cache.service';

describe('ObjectCacheService', () => {
  let service: ObjectCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ObjectCacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

});
