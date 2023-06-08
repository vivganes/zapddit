// Refer - https://gist.github.com/dvaJi/cf552bbe6725535955f7a5eeb92d7d2e

import { Params } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

export class MockActivatedRoute {
  private innerTestParams?: any;
  private subject?: BehaviorSubject<any> = new BehaviorSubject(this.testParams);

  params = this.subject?.asObservable();
  queryParams = this.subject?.asObservable();

  constructor(params?: Params) {
    if (params) {
      this.testParams = params;
    } else {
      this.testParams = {};
    }
  }

  get testParams() {
    return this.innerTestParams;
  }

  set testParams(params: {}) {
    this.innerTestParams = params;
    this.subject?.next(params);
  }

  get snapshot() {
    return { params: this.testParams, queryParams: this.testParams };
  }
}