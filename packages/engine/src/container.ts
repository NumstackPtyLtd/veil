import { SpacyNerAdapter } from "./adapters/ner/spacy.js";
import { SpacyEmbeddingAdapter } from "./adapters/embedding/spacy.js";
import { QdrantVectorStoreAdapter } from "./adapters/vector/qdrant.js";
import { QdrantConfigStoreAdapter } from "./adapters/config/qdrant.js";
import { FormatPreservingEncryptionAdapter } from "./adapters/encryption/format-preserving.js";
import { AuthService } from "./adapters/auth/index.js";
import { createAuthMiddleware } from "./adapters/auth/middleware.js";
import { createDb } from "./adapters/db/index.js";
import { EncryptText } from "./application/encrypt-text.js";
import { DecryptText } from "./application/decrypt-text.js";
import { SeedEntities } from "./application/seed-entities.js";
import { OrgService } from "./application/org-service.js";
import { ActivityService } from "./application/activity-service.js";

export interface EngineConfig {
  spacyUrl: string;
  qdrantUrl: string;
  qdrantApiKey?: string;
  databaseUrl: string;
  masterKey: string;
  jwtSecret: string;
  port: number;
  host: string;
}

function loadConfig(): EngineConfig {
  return {
    spacyUrl: process.env.SPACY_URL ?? "http://localhost:8000",
    qdrantUrl: process.env.QDRANT_URL ?? "http://localhost:6333",
    qdrantApiKey: process.env.QDRANT_API_KEY,
    databaseUrl:
      process.env.DATABASE_URL ??
      "postgres://veil:veil@localhost:5432/veil",
    masterKey: process.env.VEIL_MASTER_KEY ?? "change-me-in-production-please",
    jwtSecret: process.env.JWT_SECRET ?? "change-me-jwt-secret",
    port: parseInt(process.env.PORT ?? "3100", 10),
    host: process.env.HOST ?? "0.0.0.0",
  };
}

export function createContainer() {
  const config = loadConfig();

  // Database
  const db = createDb(config.databaseUrl);

  // Adapters
  const ner = new SpacyNerAdapter({ baseUrl: config.spacyUrl });
  const embedding = new SpacyEmbeddingAdapter({ baseUrl: config.spacyUrl });
  const vectorStore = new QdrantVectorStoreAdapter(
    { url: config.qdrantUrl, apiKey: config.qdrantApiKey },
    embedding,
  );
  const configStore = new QdrantConfigStoreAdapter({
    url: config.qdrantUrl,
    apiKey: config.qdrantApiKey,
  });
  const encryption = new FormatPreservingEncryptionAdapter(config.masterKey);

  // Auth
  const auth = new AuthService(db, config.jwtSecret);
  const authMiddleware = createAuthMiddleware(auth, db);

  // Application services
  const encryptText = new EncryptText(ner, vectorStore, encryption);
  const decryptText = new DecryptText(encryption);
  const seedEntities = new SeedEntities(vectorStore, encryption);
  const orgService = new OrgService(db);
  const activity = new ActivityService(db);

  return {
    config,
    db,
    vectorStore,
    configStore,
    auth,
    authMiddleware,
    useCases: { encryptText, decryptText, seedEntities },
    orgService,
    activity,
  };
}
