import type { NerAdapter } from "../../domain/ports.js";
import type { ExtractedEntity, EntityType } from "../../domain/types.js";

export interface SpacyNerConfig {
  baseUrl: string;
}

interface SpacyEntity {
  value: string;
  type: EntityType;
  start: number;
  end: number;
}

export class SpacyNerAdapter implements NerAdapter {
  private baseUrl: string;

  constructor(config: SpacyNerConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
  }

  async extract(text: string): Promise<ExtractedEntity[]> {
    const response = await fetch(`${this.baseUrl}/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`SpaCy NER failed: ${response.status}`);
    }

    const data = (await response.json()) as { entities: SpacyEntity[] };
    return data.entities;
  }
}
