import { QdrantClient } from "@qdrant/js-client-rest";
import type { VectorStoreAdapter, EmbeddingAdapter } from "../../domain/ports.js";
import type {
  EntityType,
  StoredEntity,
  VectorMatch,
} from "../../domain/types.js";

const COLLECTION_PREFIX = "veil_entities_";

export interface QdrantConfig {
  url: string;
  apiKey?: string;
}

export class QdrantVectorStoreAdapter implements VectorStoreAdapter {
  private client: QdrantClient;
  private embedding: EmbeddingAdapter;

  constructor(config: QdrantConfig, embedding: EmbeddingAdapter) {
    this.client = new QdrantClient({
      url: config.url,
      apiKey: config.apiKey,
    });
    this.embedding = embedding;
  }

  async initialize(): Promise<void> {
    const entityTypes: EntityType[] = [
      "person",
      "organization",
      "place",
      "email",
      "phone",
      "account_number",
      "id_number",
      "date",
      "custom",
    ];
    for (const type of entityTypes) {
      await this.ensureCollection(type);
    }
  }

  async seed(entities: StoredEntity[]): Promise<void> {
    const grouped = this.groupByType(entities);

    for (const [type, group] of Object.entries(grouped)) {
      await this.ensureCollection(type as EntityType);

      const texts = group.map((e) => e.realValue);
      const vectors = await this.embedding.embed(texts);

      const points = group.map((entity, i) => ({
        id: entity.id,
        vector: vectors[i],
        payload: {
          realValue: entity.realValue,
          entityType: entity.entityType,
          encryptedAvatar: entity.encryptedAvatar,
          metadata: entity.metadata ?? {},
        },
      }));

      await this.client.upsert(this.collectionName(type as EntityType), {
        wait: true,
        points,
      });
    }
  }

  async search(
    value: string,
    entityType: EntityType,
    limit = 3,
  ): Promise<VectorMatch[]> {
    const [vector] = await this.embedding.embed([value]);
    const collectionName = this.collectionName(entityType);

    try {
      const results = await this.client.search(collectionName, {
        vector,
        limit,
        with_payload: true,
      });

      return results.map((r) => ({
        entity: {
          id: String(r.id),
          realValue: (r.payload?.realValue as string) ?? "",
          entityType: (r.payload?.entityType as EntityType) ?? entityType,
          encryptedAvatar: (r.payload?.encryptedAvatar as string) ?? "",
          metadata: (r.payload?.metadata as Record<string, unknown>) ?? {},
        },
        score: r.score,
      }));
    } catch {
      return [];
    }
  }

  async delete(entityType: EntityType, ids: string[]): Promise<void> {
    await this.client.delete(this.collectionName(entityType), {
      wait: true,
      points: ids,
    });
  }

  private async ensureCollection(type: EntityType): Promise<void> {
    const name = this.collectionName(type);
    const { collections } = await this.client.getCollections();
    const exists = collections.some((c) => c.name === name);
    if (!exists) {
      await this.client.createCollection(name, {
        vectors: {
          size: this.embedding.dimensions(),
          distance: "Cosine",
        },
      });
    }
  }

  private collectionName(type: EntityType): string {
    return `${COLLECTION_PREFIX}${type}`;
  }

  private groupByType(
    entities: StoredEntity[],
  ): Record<string, StoredEntity[]> {
    const grouped: Record<string, StoredEntity[]> = {};
    for (const entity of entities) {
      const key = entity.entityType;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entity);
    }
    return grouped;
  }
}
