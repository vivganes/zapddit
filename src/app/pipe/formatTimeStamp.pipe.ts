import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';

@Pipe({
    name: 'formatTimestamp'
})
export class formatTimestampPipe implements PipeTransform {

    transform(timestamp?: number, args?: any): any {
        if (timestamp) {
            return moment(timestamp * 1000).fromNow();
          } else {
            return 'Unknown time';
          }
    }
}