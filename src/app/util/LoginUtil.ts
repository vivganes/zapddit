import * as secp from "@noble/secp256k1";

import { bech32 } from "bech32";

/*
Most of this logic is adapted from snort.social repository.  Thanks to them :)
*/
export class LoginUtil{
    static getHexFromPrivateKey(key:string):string{ 
        const hasSubtleCrypto = window.crypto.subtle !== undefined;     
        const insecureMsg = "Can't login with private key on an insecure connection, please use a Nostr key manager (NIP-07) extension instead"  
            
        if (key.startsWith("nsec")) {
            if (!hasSubtleCrypto) {
            throw new Error(insecureMsg);
            }
            const hexKey = LoginUtil.bech32ToHex(key);
            if (secp.utils.isValidPrivateKey(hexKey)) {
            return hexKey;
            } else {
            throw new Error("Invalid Private Key");
            }
        } else if (key.startsWith("npub")) {
            const hexKey = LoginUtil.bech32ToHex(key);
            return hexKey;
        } else if (secp.utils.isValidPrivateKey(key)) {
            if (!hasSubtleCrypto) {
            throw new Error(insecureMsg);
            }
            return key;
        } else {
            throw new Error("Invalid Private Key");
        }          
    }

    static bech32ToHex(str: string) {
        try {
          const nKey = bech32.decode(str, 1_000);
          const buff = bech32.fromWords(nKey.words);
          return secp.utils.bytesToHex(Uint8Array.from(buff));
        } catch {
          return str;
        }
    }

    static getPublicKey(privKey: string) {
        return secp.utils.bytesToHex(secp.schnorr.getPublicKey(privKey));
    }

    static getNpubFromHex( hex?: string) {
        if (typeof hex !== "string" || hex.length === 0 || hex.length % 2 !== 0) {
          return "";
        }      
        try {
            const buf = secp.utils.hexToBytes(hex);
            return bech32.encode('npub', bech32.toWords(buf));          
        } catch (e) {
          console.warn("Invalid hex", hex, e);
          return "";
        }
      }
}