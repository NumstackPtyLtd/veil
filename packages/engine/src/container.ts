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

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

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
    spacyUrl: requireEnv("SPACY_URL"),
    qdrantUrl: requireEnv("QDRANT_URL"),
    qdrantApiKey: process.env.QDRANT_API_KEY,
    databaseUrl: requireEnv("DATABASE_URL"),
    masterKey: requireEnv("VEIL_MASTER_KEY"),
    jwtSecret: requireEnv("JWT_SECRET"),
    port: parseInt(requireEnv("PORT"), 10),
    host: requireEnv("HOST"),
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
  const decryptText = new DecryptText();
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
