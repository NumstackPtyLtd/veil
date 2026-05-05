import type { ExtractedEntity, PatternRule } from "../../domain/types.js";

export function extractByPatterns(
  text: string,
  patterns: PatternRule[],
): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  for (const rule of patterns) {
    if (!rule.enabled) continue;

    const regex = new RegExp(rule.pattern, "g");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      entities.push({
        value: match[0],
        type: rule.entityType,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  return entities;
}

export function mergeEntities(
  nerEntities: ExtractedEntity[],
  patternEntities: ExtractedEntity[],
): ExtractedEntity[] {
  // Patterns are explicitly configured — they take priority over NER
  // Put patterns first so they win on equal-length overlaps
  const all = [...patternEntities, ...nerEntities];
  all.sort((a, b) => a.start - b.start);

  const merged: ExtractedEntity[] = [];
  for (const entity of all) {
    const last = merged[merged.length - 1];
    if (last && entity.start < last.end) {
      // On overlap: keep longer span, or keep first (pattern) on tie
      if (entity.end - entity.start > last.end - last.start) {
        merged[merged.length - 1] = entity;
      }
      continue;
    }
    merged.push(entity);
  }

  return merged;
}
