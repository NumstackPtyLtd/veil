import type { VectorStoreAdapter, EncryptionAdapter } from "../domain/ports.js";
import type { EntityType, StoredEntity } from "../domain/types.js";
import { randomUUID } from "node:crypto";

export interface SeedEntityInput {
  realValue: string;
  entityType: EntityType;
  encryptedAvatar?: string;
  metadata?: Record<string, unknown>;
}

export class SeedEntities {
  constructor(
    private vectorStore: VectorStoreAdapter,
    private encryption: EncryptionAdapter,
  ) {}

  async execute(
    entities: SeedEntityInput[],
    tenantSalt: string,
  ): Promise<StoredEntity[]> {
    const stored: StoredEntity[] = entities.map((input) => ({
      id: randomUUID(),
      realValue: input.realValue,
      entityType: input.entityType,
      encryptedAvatar:
        input.encryptedAvatar ??
        this.encryption.encrypt(input.realValue, tenantSalt),
      metadata: input.metadata,
    }));

    await this.vectorStore.seed(stored);
    return stored;
  }
}
