import * as secp from "@noble/secp256k1";
import * as utils from "@noble/curves/abstract/utils";
import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { HDKey } from "@scure/bip32";
import { bech32 } from "bech32";
import { NDKUser } from "@nostr-dev-kit/ndk";
import { Util } from "./Util";



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

export enum TLVEntryType {
  Special = 0,
  Relay = 1,
  Author = 2,
  Kind = 3,
}

export interface TLVEntry {
  type: TLVEntryType;
  length: number;
  value: string | number;
}

export interface NewCredential{
  pubkey: string,
  privateKey:string
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

    static generateBip39Entropy(mnemonic?: string): Uint8Array {
      try {
        const mn = mnemonic ?? bip39.generateMnemonic(wordlist, 256);
        return bip39.mnemonicToEntropy(mn, wordlist);
      } catch (e) {
        throw new Error("INVALID MNEMONIC PHRASE");
      }
    }

    static generateNewCredential(): NewCredential {
      const ent = LoginUtil.generateBip39Entropy();
      const privateKey = LoginUtil.entropyToPrivateKey(ent);
      const publicKey = utils.bytesToHex(secp.schnorr.getPublicKey(privateKey));
      return {
        pubkey: this.hexToBech32("npub",publicKey),
        privateKey: this.hexToBech32("nsec",privateKey)
      }      
    }

    /**
     * Derive NIP-06 private key from master key
     */
    static entropyToPrivateKey(entropy: Uint8Array): string {
      const masterKey = HDKey.fromMasterSeed(entropy);
      const newKey = masterKey.derive("m/44'/1237'/0'/0/0"); // Thanks - https://github.com/v0l/snort/blob/main/packages/app/src/Const.ts

      if (!newKey.privateKey) {
        throw new Error("INVALID KEY DERIVATION");
      }

      return utils.bytesToHex(newKey.privateKey);
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

    static decodeTLV(str: string) {
      const decoded = bech32.decode(str, 1_000);
      const data = bech32.fromWords(decoded.words);
    
      const entries: TLVEntry[] = [];
      let x = 0;
      while (x < data.length) {
        const t = data[x];
        const l = data[x + 1];
        const v = data.slice(x + 2, x + 2 + l);
        entries.push({
          type: t,
          length: l,
          value: LoginUtil.decodeTLVEntry(t, decoded.prefix, new Uint8Array(v)),
        });
        x += 2 + l;
      }
      return entries;
    }
    
    static decodeTLVEntry(type: TLVEntryType, prefix: string, data: Uint8Array) {
      switch (type) {
        case TLVEntryType.Special: {
          if (prefix === NostrPrefix.Address) {
            return new TextDecoder("ASCII").decode(data);
          } else {
            return utils.bytesToHex(data);
          }
        }
        case TLVEntryType.Author: {
          return utils.bytesToHex(data);
        }
        case TLVEntryType.Kind: {
          return new Uint32Array(new Uint8Array(data.reverse()).buffer)[0];
        }
        case TLVEntryType.Relay: {
          return new TextDecoder("ASCII").decode(data);
        }
      }
    }
}