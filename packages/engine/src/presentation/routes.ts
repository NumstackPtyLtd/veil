import type { FastifyInstance } from "fastify";
import type { EncryptText } from "../application/encrypt-text.js";
import type { DecryptText } from "../application/decrypt-text.js";
import type { SeedEntities } from "../application/seed-entities.js";
import type { SeedEntityInput } from "../application/seed-entities.js";
import type { QdrantConfigStoreAdapter } from "../adapters/config/qdrant.js";
import type { EntityMapping, TenantConfig, PatternRule } from "../domain/types.js";

interface EncryptBody {
  text: string;
  tenantSalt: string;
}

interface DecryptBody {
  text: string;
  mappings: EntityMapping[];
  tenantSalt: string;
}

interface SeedBody {
  entities: SeedEntityInput[];
  tenantSalt: string;
}

export function registerRoutes(
  app: FastifyInstance,
  useCases: {
    encryptText: EncryptText;
    decryptText: DecryptText;
    seedEntities: SeedEntities;
  },
  configStore: QdrantConfigStoreAdapter,
): void {
  app.get("/health", async () => ({ status: "ok" }));

  // --- Encrypt / Decrypt ---

  app.post<{ Body: EncryptBody }>("/encrypt", async (request, reply) => {
    const { text, tenantSalt } = request.body;
    if (!text || !tenantSalt) {
      return reply.status(400).send({ error: "text and tenantSalt required" });
    }

    const config = configStore.getOrDefault(tenantSalt);
    const result = await useCases.encryptText.execute(
      text,
      tenantSalt,
      config.patterns,
      config.thresholds,
    );
    return result;
  });

  app.post<{ Body: DecryptBody }>("/decrypt", async (request, reply) => {
    const { text, mappings, tenantSalt } = request.body;
    if (!text || !mappings || !tenantSalt) {
      return reply
        .status(400)
        .send({ error: "text, mappings, and tenantSalt required" });
    }

    const result = await useCases.decryptText.execute(text, mappings, tenantSalt);
    return result;
  });

  // --- Entity Store ---

  app.post<{ Body: SeedBody }>("/entities", async (request, reply) => {
    const { entities, tenantSalt } = request.body;
    if (!entities?.length || !tenantSalt) {
      return reply
        .status(400)
        .send({ error: "entities array and tenantSalt required" });
    }

    const stored = await useCases.seedEntities.execute(entities, tenantSalt);
    return { seeded: stored.length, entities: stored };
  });

  // --- Tenant Config ---

  app.get<{ Params: { tenantId: string } }>(
    "/config/:tenantId",
    async (request) => {
      return configStore.getOrDefault(request.params.tenantId);
    },
  );

  app.put<{ Params: { tenantId: string }; Body: Partial<TenantConfig> }>(
    "/config/:tenantId",
    async (request) => {
      const existing = configStore.getOrDefault(request.params.tenantId);
      const updated: TenantConfig = {
        ...existing,
        ...request.body,
        tenantId: request.params.tenantId,
      };
      await configStore.save(updated);
      return updated;
    },
  );

  app.get("/config", async () => {
    const configs = await configStore.list();
    return { configs };
  });

  // --- Pattern Rules (convenience sub-routes) ---

  app.post<{ Params: { tenantId: string }; Body: PatternRule }>(
    "/config/:tenantId/patterns",
    async (request) => {
      const config = configStore.getOrDefault(request.params.tenantId);
      config.patterns.push(request.body);
      await configStore.save(config);
      return config;
    },
  );

  app.delete<{ Params: { tenantId: string; patternId: string } }>(
    "/config/:tenantId/patterns/:patternId",
    async (request) => {
      const config = configStore.getOrDefault(request.params.tenantId);
      config.patterns = config.patterns.filter(
        (p) => p.id !== request.params.patternId,
      );
      await configStore.save(config);
      return config;
    },
  );
}
