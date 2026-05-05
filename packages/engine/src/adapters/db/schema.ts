import {
  pgTable,
  text,
  timestamp,
  boolean,
  real,
  jsonb,
  pgEnum,
  uuid,
  integer,
} from "drizzle-orm/pg-core";

// --- Enums ---

export const roleEnum = pgEnum("role", [
  "owner",
  "admin",
  "member",
  "viewer",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "encrypt",
  "decrypt",
  "seed",
  "ner_extract",
  "vector_search",
  "config_update",
  "login",
  "user_invite",
]);

// --- Organizations ---

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  config: jsonb("config").$type<OrgConfig>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Domains (belong to org, inherit + override rules) ---

export const domains = pgTable("domains", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  salt: text("salt").notNull(),
  config: jsonb("config").$type<DomainConfig>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Users ---

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Memberships (user <-> org with role) ---

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Sessions ---

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Activity Log ---

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  domainId: uuid("domain_id").references(() => domains.id, {
    onDelete: "set null",
  }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  type: activityTypeEnum("type").notNull(),
  meta: jsonb("meta").$type<Record<string, unknown>>().default({}),
  entitiesDetected: integer("entities_detected"),
  vectorSearches: integer("vector_searches"),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Config types ---

export interface OrgConfig {
  thresholds?: {
    autoMatch: number;
    probableMatch: number;
    uncertainMatch: number;
  };
  patterns?: PatternRuleConfig[];
  labelOverrides?: Record<string, string>;
  masterKeyOverride?: string;
}

export interface DomainConfig {
  thresholds?: {
    autoMatch: number;
    probableMatch: number;
    uncertainMatch: number;
  };
  patterns?: PatternRuleConfig[];
  labelOverrides?: Record<string, string>;
}

export interface PatternRuleConfig {
  id: string;
  name: string;
  pattern: string;
  entityType: string;
  enabled: boolean;
}
