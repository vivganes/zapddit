import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'newLineToBr'
})
export class NewLineToBrPipe implements PipeTransform {

    transform(text?:string): string {
        if(text)
            return text?.replaceAll('\n','<br/>')    
        else 
            return '';    
    }
}