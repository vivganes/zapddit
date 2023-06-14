import { TestBed } from '@angular/core/testing';

import { RelaysService } from './relays.service';

describe('RelaysService', () => {
  let service: RelaysService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RelaysService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
