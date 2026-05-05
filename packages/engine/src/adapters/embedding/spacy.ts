import type { EmbeddingAdapter } from "../../domain/ports.js";

export interface SpacyEmbeddingConfig {
  baseUrl: string;
}

interface EmbedResponse {
  embeddings: number[][];
  dimensions: number;
}

export class SpacyEmbeddingAdapter implements EmbeddingAdapter {
  private baseUrl: string;
  private dims: number | null = null;

  constructor(config: SpacyEmbeddingConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
  }

  async embed(texts: string[]): Promise<number[][]> {
    const response = await fetch(`${this.baseUrl}/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
    });

    if (!response.ok) {
      throw new Error(`SpaCy embedding failed: ${response.status}`);
    }

    const data = (await response.json()) as EmbedResponse;
    this.dims = data.dimensions;
    return data.embeddings;
  }

  dimensions(): number {
    return this.dims ?? 384;
  }
}
