import { ToastService } from "angular-toastify";
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

    static validateZapSplitConfig(zapSplitConfig:ZapSplitConfig):ZapSplitConfig{
        //validate if percentage totals greater than 100%
        let devPercentageTotal = 0;
        zapSplitConfig.developers.forEach((d) => {
            devPercentageTotal += d.percentage;
        });

        let translatorTotal = 0;
        zapSplitConfig.translators.forEach((t) => {
            translatorTotal += t.percentage
        });

        if(devPercentageTotal + translatorTotal > 100){
            new ToastService().warn('Zap Split configuration was invalid.  We have reset this to default.  You can change this from Preferences.');
            const resetConfig = ZapSplitUtil.prepareDefaultZapSplitConfig();
            localStorage.setItem(Constants.ZAP_SPLIT_CONFIG, JSON.stringify(resetConfig))
            return resetConfig;
        } 
        return zapSplitConfig;

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