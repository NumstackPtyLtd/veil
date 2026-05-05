import type {
  ExtractedEntity,
  EntityType,
  StoredEntity,
  VectorMatch,
  TenantConfig,
} from "./types.js";

export interface NerAdapter {
  extract(text: string): Promise<ExtractedEntity[]>;
}

export interface VectorStoreAdapter {
  initialize(): Promise<void>;
  seed(entities: StoredEntity[]): Promise<void>;
  search(
    value: string,
    entityType: EntityType,
    limit?: number,
  ): Promise<VectorMatch[]>;
  delete(entityType: EntityType, ids: string[]): Promise<void>;
}

export interface EncryptionAdapter {
  encrypt(value: string, tenantSalt: string): string;
  decrypt(encrypted: string, tenantSalt: string): string;
}

export interface EmbeddingAdapter {
  embed(texts: string[]): Promise<number[][]>;
  dimensions(): number;
}

export interface ConfigStoreAdapter {
  get(tenantId: string): Promise<TenantConfig | null>;
  save(config: TenantConfig): Promise<void>;
  list(): Promise<TenantConfig[]>;
}
