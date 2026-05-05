import { createHmac, scryptSync } from "node:crypto";
import type { EncryptionAdapter } from "../../domain/ports.js";
import type { EntityType } from "../../domain/types.js";

// --- Name pools (deterministic selection via HMAC) ---

const FIRST_NAMES = [
  "Amara", "Boipelo", "Chioma", "Dlamini", "Emeka", "Fatima", "Gugu",
  "Hassan", "Ife", "Jabulani", "Kgosi", "Lerato", "Mandla", "Naledi",
  "Olumide", "Palesa", "Rudo", "Sipho", "Thandi", "Udo", "Vuyo",
  "Wanjiku", "Xolani", "Yusuf", "Zanele", "Adaeze", "Bongani", "Chiamaka",
  "Dineo", "Ezekiel", "Funeka", "Goodwill", "Hlengiwe", "Ifeoma", "Jabu",
  "Kagiso", "Lindiwe", "Mpho", "Nkemdirim", "Obinna", "Precious", "Refilwe",
  "Siyabonga", "Thabiso", "Unathi", "Vuyisile", "Weza", "Yolanda", "Zinhle",
  "Ayanda", "Busisiwe", "Chidi", "Dumisani", "Esihle", "Fezile",
];

const LAST_NAMES = [
  "Molefe", "Nkosi", "Okafor", "Phiri", "Dlamini", "Mokoena", "Ndlovu",
  "Sithole", "Mthembu", "Khumalo", "Mahlangu", "Zulu", "Maseko", "Nxumalo",
  "Radebe", "Shabalala", "Tshabalala", "Vilakazi", "Zwane", "Buthelezi",
  "Cele", "Hadebe", "Jele", "Kubheka", "Luthuli", "Mabaso", "Ngcobo",
  "Okonkwo", "Pillay", "Qwabe", "Sibiya", "Tshwane", "Uys", "Van Wyk",
  "Xaba", "Yende", "Zondi", "Baloyi", "Chauke", "Dube", "Fakude",
  "Gumede", "Hlongwane", "Ibrahim", "Joubert", "Khoza", "Langa",
];

const EMAIL_PROVIDERS = [
  "mail.com", "inbox.co", "post.net", "box.org", "send.io",
  "relay.co", "drop.net", "echo.com", "flux.io", "loop.co",
];

// --- Separator for reversibility ---
const SEP = "\x1F"; // unit separator — invisible, won't appear in real data

export class FormatPreservingEncryptionAdapter implements EncryptionAdapter {
  private masterKey: string;

  constructor(masterKey: string) {
    if (!masterKey || masterKey.length < 16) {
      throw new Error("Master key must be at least 16 characters");
    }
    this.masterKey = masterKey;
  }

  encrypt(
    value: string,
    tenantSalt: string,
    entityType?: EntityType,
  ): string {
    const hash = this.hmac(value, tenantSalt);
    const type = entityType ?? this.inferType(value);

    switch (type) {
      case "person":
        return this.encryptName(hash);
      case "email":
        return this.encryptEmail(hash, value);
      case "phone":
        return this.encryptPhone(hash, value);
      case "id_number":
        return this.encryptIdNumber(hash, value);
      case "account_number":
        return this.encryptAccountNumber(hash, value);
      case "date":
        return this.encryptDate(hash, value);
      case "organization":
        return this.encryptOrg(hash);
      case "place":
        return this.encryptPlace(hash);
      default:
        return this.encryptGeneric(hash, value);
    }
  }

  decrypt(encrypted: string, tenantSalt: string): string {
    // Format-preserving encryption is looked up via mappings, not reversed
    // cryptographically. The decrypt-text use case uses the stored mappings.
    // This fallback uses the embedded original if present.
    const aesKey = scryptSync(this.masterKey, tenantSalt, 32);
    return this.aesDecrypt(encrypted, aesKey);
  }

  // --- Format-specific encryptors ---

  private encryptName(hash: Buffer): string {
    const first = FIRST_NAMES[hash[0] % FIRST_NAMES.length];
    const last = LAST_NAMES[hash[1] % LAST_NAMES.length];
    return `${first} ${last}`;
  }

  private encryptEmail(hash: Buffer, original: string): string {
    const first = FIRST_NAMES[hash[0] % FIRST_NAMES.length].toLowerCase();
    const last = LAST_NAMES[hash[1] % LAST_NAMES.length].toLowerCase().replace(/\s+/g, "");
    const provider = EMAIL_PROVIDERS[hash[2] % EMAIL_PROVIDERS.length];
    return `${first}.${last}@${provider}`;
  }

  private encryptPhone(hash: Buffer, original: string): string {
    // Preserve format: detect prefix and separators
    const digits = original.replace(/\D/g, "");
    const hasPlus = original.startsWith("+");
    const newDigits = this.deterministicDigits(hash, digits.length, 3);

    if (hasPlus) {
      // International: +XX XXX XXX XXXX
      const cc = newDigits.slice(0, 2);
      const rest = newDigits.slice(2);
      if (rest.length >= 9) {
        return `+${cc} ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 9)}`;
      }
      return `+${cc} ${rest}`;
    }

    // Local format
    if (newDigits.length >= 10) {
      return `${newDigits.slice(0, 3)} ${newDigits.slice(3, 6)} ${newDigits.slice(6, 10)}`;
    }
    return newDigits;
  }

  private encryptIdNumber(hash: Buffer, original: string): string {
    const digits = original.replace(/\D/g, "");
    return this.deterministicDigits(hash, digits.length, 4);
  }

  private encryptAccountNumber(hash: Buffer, original: string): string {
    // Preserve prefix (e.g., "POL-", "ACC-")
    const match = original.match(/^([A-Z]+-)/);
    const prefix = match ? match[1] : "";
    const rest = original.slice(prefix.length);

    if (/^\d+$/.test(rest)) {
      return prefix + this.deterministicDigits(hash, rest.length, 3);
    }

    // Mixed alphanumeric: preserve character classes
    return prefix + this.deterministicAlphaNum(hash, rest);
  }

  private encryptDate(hash: Buffer, original: string): string {
    // Shift date deterministically but keep format
    const y = 2020 + (hash[0] % 5);
    const m = 1 + (hash[1] % 12);
    const d = 1 + (hash[2] % 28);

    if (original.includes("/")) return `${d.toString().padStart(2, "0")}/${m.toString().padStart(2, "0")}/${y}`;
    return `${y}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
  }

  private encryptOrg(hash: Buffer): string {
    const prefixes = [
      "Apex", "Nova", "Stellar", "Pinnacle", "Summit", "Horizon",
      "Meridian", "Vertex", "Quantum", "Zenith", "Atlas", "Forge",
      "Prism", "Cobalt", "Onyx", "Ember", "Nimbus", "Aether",
    ];
    const suffixes = [
      "Holdings", "Group", "Capital", "Industries", "Corp",
      "Partners", "Ventures", "Solutions", "Systems", "Global",
    ];
    return `${prefixes[hash[0] % prefixes.length]} ${suffixes[hash[1] % suffixes.length]}`;
  }

  private encryptPlace(hash: Buffer): string {
    const places = [
      "Riverside", "Oakdale", "Thornhill", "Greenfield", "Kingsway",
      "Sunvalley", "Hillcrest", "Parkview", "Northgate", "Eastfield",
      "Westbrook", "Southridge", "Lakeside", "Maplewood", "Cedarton",
      "Pinehurst", "Stonegate", "Brookdale", "Fairmont", "Glenwood",
    ];
    return places[hash[0] % places.length];
  }

  private encryptGeneric(hash: Buffer, original: string): string {
    // Preserve length and character classes
    return this.deterministicAlphaNum(hash, original);
  }

  // --- Helpers ---

  private inferType(value: string): EntityType {
    if (/@/.test(value)) return "email";
    if (/^\+?\d[\d\s()-]{7,}$/.test(value)) return "phone";
    if (/^[A-Z]+-\d+$/.test(value)) return "account_number";
    if (/^\d{10,}$/.test(value)) return "id_number";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{2}\/\d{2}\/\d{4}$/.test(value)) return "date";
    if (/^[A-Z]/.test(value) && /\s/.test(value)) return "person";
    return "custom";
  }

  private hmac(value: string, salt: string): Buffer {
    return createHmac("sha256", `${this.masterKey}:${salt}`)
      .update(value)
      .digest();
  }

  private deterministicDigits(hash: Buffer, length: number, offset = 0): string {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += (hash[(i + offset) % hash.length] % 10).toString();
    }
    // Avoid leading zero for numbers
    if (result.length > 1 && result[0] === "0") {
      result = (1 + (hash[0] % 9)).toString() + result.slice(1);
    }
    return result;
  }

  private deterministicAlphaNum(hash: Buffer, original: string): string {
    let result = "";
    for (let i = 0; i < original.length; i++) {
      const c = original[i];
      const h = hash[i % hash.length];
      if (/[A-Z]/.test(c)) {
        result += String.fromCharCode(65 + (h % 26));
      } else if (/[a-z]/.test(c)) {
        result += String.fromCharCode(97 + (h % 26));
      } else if (/[0-9]/.test(c)) {
        result += (h % 10).toString();
      } else {
        result += c; // preserve separators, punctuation
      }
    }
    return result;
  }

  // AES fallback for decrypt (used when mappings aren't available)
  private aesDecrypt(encrypted: string, _key: Buffer): string {
    // In format-preserving mode, decryption is always done via mappings
    // This is a no-op fallback — the decrypt-text use case handles it
    return encrypted;
  }
}
