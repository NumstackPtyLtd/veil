import type {
  NerAdapter,
  VectorStoreAdapter,
  EncryptionAdapter,
} from "../domain/ports.js";
import type {
  EncryptionResult,
  EntityMapping,
  ExtractedEntity,
  PatternRule,
  ConfidenceThresholds,
} from "../domain/types.js";
import { DEFAULT_THRESHOLDS, DEFAULT_PATTERNS } from "../domain/types.js";
import {
  extractByPatterns,
  mergeEntities,
} from "../adapters/ner/patterns.js";

export class EncryptText {
  constructor(
    private ner: NerAdapter,
    private vectorStore: VectorStoreAdapter,
    private encryption: EncryptionAdapter,
  ) {}

  async execute(
    text: string,
    tenantSalt: string,
    patterns: PatternRule[] = DEFAULT_PATTERNS,
    thresholds: ConfidenceThresholds = DEFAULT_THRESHOLDS,
  ): Promise<EncryptionResult> {
    const nerEntities = await this.ner.extract(text);
    const patternEntities = extractByPatterns(text, patterns);
    const entities = mergeEntities(nerEntities, patternEntities);

    const mappings: EntityMapping[] = [];

    for (const entity of entities) {
      const matches = await this.vectorStore.search(
        entity.value,
        entity.type,
        1,
      );

      const topMatch = matches[0];

      if (topMatch && topMatch.score >= thresholds.uncertainMatch) {
        const encrypted =
          topMatch.score >= thresholds.probableMatch &&
          topMatch.entity.encryptedAvatar
            ? topMatch.entity.encryptedAvatar
            : this.encryption.encrypt(entity.value, tenantSalt);

        mappings.push({
          original: entity.value,
          replacement: encrypted,
          entityType: entity.type,
          matchScore: topMatch.score,
          source: "vector",
        });
      } else {
        const encrypted = this.encryption.encrypt(entity.value, tenantSalt);
        mappings.push({
          original: entity.value,
          replacement: encrypted,
          entityType: entity.type,
          matchScore: topMatch?.score ?? 0,
          source: "ner",
        });
      }
    }

    const veiled = this.applyReplacements(text, entities, mappings);

    return { originalText: text, veiled, mappings };
  }

  private applyReplacements(
    text: string,
    entities: ExtractedEntity[],
    mappings: EntityMapping[],
  ): string {
    const sorted = entities
      .map((e, i) => ({ entity: e, mapping: mappings[i] }))
      .sort((a, b) => b.entity.start - a.entity.start);

    let result = text;
    for (const { entity, mapping } of sorted) {
      result =
        result.slice(0, entity.start) +
        mapping.replacement +
        result.slice(entity.end);
    }
    return result;
  }
}
