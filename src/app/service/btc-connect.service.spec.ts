import { TestBed } from '@angular/core/testing';

import { BtcConnectService } from './btc-connect.service';

describe('BtcConnectService', () => {
  let service: BtcConnectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BtcConnectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
