import type { EncryptionAdapter } from "../domain/ports.js";
import type { DecryptionResult, EntityMapping } from "../domain/types.js";

export class DecryptText {
  constructor(private encryption: EncryptionAdapter) {}

  async execute(
    veiledText: string,
    mappings: EntityMapping[],
    tenantSalt: string,
  ): Promise<DecryptionResult> {
    let unveiled = veiledText;

    const reverseMappings: EntityMapping[] = mappings.map((m) => {
      const original =
        m.source === "ner"
          ? this.encryption.decrypt(m.replacement, tenantSalt)
          : m.original;

      return { ...m, original };
    });

    for (const mapping of reverseMappings) {
      unveiled = unveiled.replaceAll(mapping.replacement, mapping.original);
    }

    return { veiledText, unveiled, mappings: reverseMappings };
  }
}
