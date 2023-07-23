import { TestBed } from '@angular/core/testing';

import { CommunityCacheService } from './community-cache.service';

describe('CommunityCacheService', () => {
  let service: CommunityCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommunityCacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
