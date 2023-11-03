import { TestBed } from '@angular/core/testing';

import { CommunityPageService } from './community-page.service';

describe('CommunityPageService', () => {
  let service: CommunityPageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommunityPageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
