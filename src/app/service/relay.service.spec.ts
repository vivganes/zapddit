import { TestBed } from '@angular/core/testing';

import { RelayService } from './relay.service';

describe('RelayService', () => {
  let service: RelayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RelayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
