import { createCipheriv, createDecipheriv, scryptSync } from "node:crypto";
import type { EncryptionAdapter } from "../../domain/ports.js";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export class AesEncryptionAdapter implements EncryptionAdapter {
  private masterKey: string;

  constructor(masterKey: string) {
    if (!masterKey || masterKey.length < 16) {
      throw new Error("Master key must be at least 16 characters");
    }
    this.masterKey = masterKey;
  }

  encrypt(value: string, tenantSalt: string): string {
    const key = this.deriveKey(tenantSalt);
    const iv = this.deterministicIv(value, tenantSalt);

    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]).toString("base64url");
  }

  decrypt(encrypted: string, tenantSalt: string): string {
    const key = this.deriveKey(tenantSalt);
    const data = Buffer.from(encrypted, "base64url");

    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(ciphertext) + decipher.final("utf8");
  }

  private deriveKey(tenantSalt: string): Buffer {
    return scryptSync(this.masterKey, tenantSalt, KEY_LENGTH);
  }

  private deterministicIv(value: string, salt: string): Buffer {
    return scryptSync(value, `${this.masterKey}:${salt}`, IV_LENGTH);
  }
}
