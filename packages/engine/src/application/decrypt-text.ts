import type { DecryptionResult, EntityMapping } from "../domain/types.js";

export class DecryptText {
  async execute(
    veiledText: string,
    mappings: EntityMapping[],
    _tenantSalt: string,
  ): Promise<DecryptionResult> {
    let unveiled = veiledText;

    for (const mapping of mappings) {
      unveiled = unveiled.replaceAll(mapping.replacement, mapping.original);
    }

    return { veiledText, unveiled, mappings };
  }
}
