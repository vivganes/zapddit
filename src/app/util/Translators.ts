// Tamil Translators
const VIVEK = 'facdaf1ce758bdf04cdf1a1fa32a3564a608d4abc2481a286ffc178f86953ef0';
const KAMAL = 'c094ccc6b3b3f969bc37a900a01a3c69c692532fedab909aaa6cce8bf5f06a03';

// Persian Translators
const L = 'c07a2ea48b6753d11ad29d622925cb48bab48a8f38e954e85aec46953a0752a2';

// Finnish Translators
const PETRI = 'e417ee3d910253993ae0ce6b41d4a24609970f132958d75b2d9b634d60a3cc08';

// Thai Translators
const VAZ = '58f5a23008ba5a8730a435f68f18da0b10ce538c6e2aa5a1b7812076304d59f7';

// French Translators
const SOLO = '31da2214d943b6db29848bfe7e3cf8ec0380014414f06cddb0eeacc9af2508e2';

// Swahili Translators
const TURISMO = '06830f6cb5925bd82cca59bda848f0056666dff046c5382963a997a234da40c5';

// German translators
const FLOBSTR = '4b6147b45bbde75c2ce4cf93444675945c47f41ffd51e3446287bbd56ba668d2';

export const Translators: TranslatorsForLanguage[] = [
    {
        language: 'de',
        translatorPubKeys: [FLOBSTR]
    },    
    {
        language: 'fa',
        translatorPubKeys: [L]
    },
    {
        language: 'fi',
        translatorPubKeys: [PETRI]
    },
    {
        language: 'fr',
        translatorPubKeys: [SOLO]
    },
    {
        language: 'sw',
        translatorPubKeys: [TURISMO]
    },
    {
        language: 'ta',
        translatorPubKeys: [VIVEK,KAMAL]
    },
    {
        language: 'th',
        translatorPubKeys: [VAZ]
    }
]


export interface TranslatorsForLanguage{
    language: string;
    translatorPubKeys: string[]
}
