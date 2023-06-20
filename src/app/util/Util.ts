import { NDKEvent } from "@nostr-dev-kit/ndk";
import { decode as invoiceDecode } from "light-bolt11-decoder";


export class Util{
    static getAmountFromInvoice(invoice: string): number|undefined {
        try {
          const parsed = invoiceDecode(invoice);
      
          const amountSection = parsed.sections.find((a:any) => a.name === "amount");
          const amount = amountSection ? Number(amountSection.value as number | string) : undefined;              
          return amount;
        } catch (e) {
          console.error(e);
        }
        return undefined;
      }


    static isDownzap(zapEvent: NDKEvent):boolean {
        const descTagSet = zapEvent.getMatchingTags('description');
        if (descTagSet.length > 0) {
          const descTag = descTagSet[0];
          if (descTag.length > 1) {
            const descriptionStr = descTag[1];
            const descriptionObj = JSON.parse(descriptionStr);
            if (descriptionObj.content?.indexOf('-') > -1) {
              return true;
            }
          }
        }
        return false;
    }
}