import { eq } from "drizzle-orm";
import type { Db } from "../adapters/db/index.js";
import { schema } from "../adapters/db/index.js";
import type { OrgConfig, DomainConfig } from "../adapters/db/schema.js";
import { DEFAULT_THRESHOLDS, DEFAULT_PATTERNS } from "../domain/types.js";
import type { ConfidenceThresholds, PatternRule } from "../domain/types.js";

export interface ResolvedConfig {
  thresholds: ConfidenceThresholds;
  patterns: PatternRule[];
  labelOverrides: Record<string, string>;
}

export class OrgService {
  constructor(private db: Db) {}

  async createOrg(name: string, slug: string, userId: string) {
    const [org] = await this.db
      .insert(schema.organizations)
      .values({ name, slug })
      .returning();

    await this.db.insert(schema.memberships).values({
      userId,
      orgId: org.id,
      role: "owner",
    });

    return org;
  }

  async createDomain(orgId: string, name: string, slug: string, salt: string) {
    const [domain] = await this.db
      .insert(schema.domains)
      .values({ orgId, name, slug, salt })
      .returning();
    return domain;
  }

  async getOrg(orgId: string) {
    const [org] = await this.db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, orgId))
      .limit(1);
    return org ?? null;
  }

  async listOrgs(userId: string) {
    const memberships = await this.db
      .select({
        org: schema.organizations,
        role: schema.memberships.role,
      })
      .from(schema.memberships)
      .innerJoin(
        schema.organizations,
        eq(schema.memberships.orgId, schema.organizations.id),
      )
      .where(eq(schema.memberships.userId, userId));

    return memberships.map((m) => ({ ...m.org, role: m.role }));
  }

  async listDomains(orgId: string) {
    return this.db
      .select()
      .from(schema.domains)
      .where(eq(schema.domains.orgId, orgId));
  }

  async updateOrgConfig(orgId: string, config: Partial<OrgConfig>) {
    const org = await this.getOrg(orgId);
    if (!org) throw new Error("Organization not found");

    const merged = { ...(org.config as OrgConfig), ...config };
    const [updated] = await this.db
      .update(schema.organizations)
      .set({ config: merged, updatedAt: new Date() })
      .where(eq(schema.organizations.id, orgId))
      .returning();
    return updated;
  }

  async updateDomainConfig(domainId: string, config: Partial<DomainConfig>) {
    const [domain] = await this.db
      .select()
      .from(schema.domains)
      .where(eq(schema.domains.id, domainId))
      .limit(1);
    if (!domain) throw new Error("Domain not found");

    const merged = { ...(domain.config as DomainConfig), ...config };
    const [updated] = await this.db
      .update(schema.domains)
      .set({ config: merged, updatedAt: new Date() })
      .where(eq(schema.domains.id, domainId))
      .returning();
    return updated;
  }

  async resolveConfig(domainId: string): Promise<ResolvedConfig> {
    const [domain] = await this.db
      .select()
      .from(schema.domains)
      .where(eq(schema.domains.id, domainId))
      .limit(1);
    if (!domain) throw new Error("Domain not found");

    const [org] = await this.db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, domain.orgId))
      .limit(1);

    const orgConfig = (org?.config as OrgConfig) ?? {};
    const domainConfig = (domain.config as DomainConfig) ?? {};

    return {
      thresholds: domainConfig.thresholds ?? orgConfig.thresholds ?? DEFAULT_THRESHOLDS,
      patterns: (domainConfig.patterns ?? orgConfig.patterns ?? DEFAULT_PATTERNS) as PatternRule[],
      labelOverrides: {
        ...(orgConfig.labelOverrides ?? {}),
        ...(domainConfig.labelOverrides ?? {}),
      },
    };
  }
}
