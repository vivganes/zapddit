import ZapSplitConfig, { HexKeyWithSplitPercentage } from "../model/ZapSplitConfig";
import { Constants } from "./Constants";
import { Translators } from "./Translators";

export class ZapSplitUtil{

    static prepareDefaultZapSplitConfig():ZapSplitConfig{
        const language = ZapSplitUtil.getCurrentLanguage();
        const translatorZapSplitEntries: HexKeyWithSplitPercentage[] = ZapSplitUtil.getZapSplitEntriesForTranslators(language);
        return {
            developers: [{
                hexKey: Constants.ZAPDDIT_PUBKEY,
                percentage: 0.05
            }],
            translators: translatorZapSplitEntries
        }

    }

    static getZapSplitEntriesForTranslators(language: string) {
        const translatorPubKeys = this.findTranslators(language);
        const defaultZapSplitForTranslators = 0.05;
        const zapSplitPerTranslator = defaultZapSplitForTranslators / translatorPubKeys.length;
        const translatorZapSplitEntries: HexKeyWithSplitPercentage[] = translatorPubKeys.map((t) => {
            return { hexKey: t, percentage: zapSplitPerTranslator };
        });
        return translatorZapSplitEntries;
    }

    static findTranslators(language:string){
        const translatorsForLanguage = Translators.filter(entry => entry.language === language)
        if(translatorsForLanguage && translatorsForLanguage.length>0){
            return translatorsForLanguage[0].translatorPubKeys;
        }
        return [];
    }

    static getCurrentLanguage(){
        var language = localStorage.getItem(Constants.LANGUAGE);
        if (language != null || language != undefined || language != '') {
            const currentLanguage = language as string;
            return currentLanguage || 'en';
        } else {
            return 'en';
        }
    }

}