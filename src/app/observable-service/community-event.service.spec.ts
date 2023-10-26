import { TestBed } from '@angular/core/testing';

import { CommunityEventService } from './community-event.service';

describe('CommunityEventService', () => {
  let service: CommunityEventService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommunityEventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
