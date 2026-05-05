import { QdrantClient } from "@qdrant/js-client-rest";
import type { ConfigStoreAdapter } from "../../domain/ports.js";
import type { TenantConfig } from "../../domain/types.js";
import { DEFAULT_THRESHOLDS, DEFAULT_PATTERNS } from "../../domain/types.js";

const COLLECTION = "veil_tenant_configs";

export class QdrantConfigStoreAdapter implements ConfigStoreAdapter {
  private client: QdrantClient;
  private cache = new Map<string, TenantConfig>();

  constructor(config: { url: string; apiKey?: string }) {
    this.client = new QdrantClient({ url: config.url, apiKey: config.apiKey });
  }

  async initialize(): Promise<void> {
    const { collections } = await this.client.getCollections();
    if (!collections.some((c) => c.name === COLLECTION)) {
      await this.client.createCollection(COLLECTION, {
        vectors: { size: 1, distance: "Cosine" },
      });
    }

    const { points } = await this.client.scroll(COLLECTION, {
      limit: 100,
      with_payload: true,
    });

    for (const point of points) {
      const config = point.payload?.config as unknown as TenantConfig;
      if (config?.tenantId) {
        this.cache.set(config.tenantId, config);
      }
    }
  }

  async get(tenantId: string): Promise<TenantConfig | null> {
    return this.cache.get(tenantId) ?? null;
  }

  async save(config: TenantConfig): Promise<void> {
    this.cache.set(config.tenantId, config);

    await this.client.upsert(COLLECTION, {
      wait: true,
      points: [
        {
          id: this.tenantIdToPointId(config.tenantId),
          vector: [0],
          payload: { config: config as unknown as Record<string, unknown> },
        },
      ],
    });
  }

  async list(): Promise<TenantConfig[]> {
    return Array.from(this.cache.values());
  }

  getOrDefault(tenantId: string): TenantConfig {
    return (
      this.cache.get(tenantId) ?? {
        tenantId,
        patterns: DEFAULT_PATTERNS,
        thresholds: DEFAULT_THRESHOLDS,
        labelOverrides: {},
      }
    );
  }

  private tenantIdToPointId(tenantId: string): number {
    let hash = 0;
    for (let i = 0; i < tenantId.length; i++) {
      hash = (hash * 31 + tenantId.charCodeAt(i)) & 0x7fffffff;
    }
    return hash || 1;
  }
}
