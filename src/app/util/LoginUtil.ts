import * as secp from "@noble/secp256k1";
import * as utils from "@noble/curves/abstract/utils";
import { bech32 } from "bech32";



/*
Most of this logic is adapted from snort.social repository.  Thanks to them :)
*/

export enum NostrPrefix {
  PublicKey = "npub",
  PrivateKey = "nsec",
  Note = "note",

  // TLV prefixes
  Profile = "nprofile",
  Event = "nevent",
  Relay = "nrelay",
  Address = "naddr",
}
export class LoginUtil{
    static getHexFromPrivateOrPubKey(key:string):string{ 
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

    /* Thanks to https://github.com/v0l/snort/blob/main/packages/app/src/Util.ts
    */
    static hexToBech32(idType: string, hex?: string) {
      if (typeof hex !== "string" || hex.length === 0 || hex.length % 2 !== 0) {
        return "";
      }
    
      try {
        if (idType === NostrPrefix.Note || idType === NostrPrefix.PrivateKey || idType === NostrPrefix.PublicKey) {
          const buf = utils.hexToBytes(hex);
          return bech32.encode(idType, bech32.toWords(buf));
        } else {
          return LoginUtil.encodeTLV(idType as NostrPrefix, hex);
        }
      } catch (e) {
        console.warn("Invalid hex", hex, e);
        return "";
      }
    }

    static encodeTLV(prefix: NostrPrefix, id: string, relays?: string[], kind?: number, author?: string) {
      const enc = new TextEncoder();
      const buf = prefix === NostrPrefix.Address ? enc.encode(id) : utils.hexToBytes(id);
    
      const tl0 = [0, buf.length, ...buf];
      const tl1 =
        relays
          ?.map((a) => {
            const data = enc.encode(a);
            return [1, data.length, ...data];
          })
          .flat() ?? [];
    
      const tl2 = author ? [2, 32, ...utils.hexToBytes(author)] : [];
      const tl3 = kind ? [3, 4, ...new Uint8Array(new Uint32Array([kind]).buffer).reverse()] : []
    
      return bech32.encode(prefix, bech32.toWords([...tl0, ...tl1, ...tl2, ...tl3]), 1_000);
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