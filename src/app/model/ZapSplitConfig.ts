
export default interface ZapSplitConfig{
    developers: HexKeyWithSplitPercentage[];
    translators: HexKeyWithSplitPercentage[];
}

export interface HexKeyWithSplitPercentage{
    hexKey: string;
    percentage: Number
}




