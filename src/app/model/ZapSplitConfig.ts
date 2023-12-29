
export default interface ZapSplitConfig{
    developers: HexKeyWithSplitPercentage[];
    translators: HexKeyWithSplitPercentage[];
}

export interface HexKeyWithSplitPercentage{
    hexKey: string;
    percentage: Number
}


export interface TranslatorsForLanguage{
    language: string;
    translatorPubKeys: string[]
}

const VIVEK = 'facdaf1ce758bdf04cdf1a1fa32a3564a608d4abc2481a286ffc178f86953ef0';
const KAMAL = '';

export const ZAPDDIT_TRANSLATORS: TranslatorsForLanguage[] = [
    {
        language: 'en',
        translatorPubKeys: []
    },
    {
        language: 'ta',
        translatorPubKeys: []
    }
]
