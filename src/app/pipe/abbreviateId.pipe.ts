import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'abbreviateId'
})
export class AbbreviateIdPipe implements PipeTransform {

    transform(id?:string): string {
        if(id){
            const len = id.length;        
            return id.slice(0,9)+'...'+id.slice(len-10,len-1);
        }
        return '';        
    }
}