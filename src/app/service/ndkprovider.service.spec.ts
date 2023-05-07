import { TestBed } from '@angular/core/testing'

import { NdkproviderService } from './ndkprovider.service'

describe('NdkproviderService', () => {
  let service: NdkproviderService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(NdkproviderService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
