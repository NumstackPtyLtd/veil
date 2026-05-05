import { eq, desc, and, gte } from "drizzle-orm";
import type { Db } from "../adapters/db/index.js";
import { schema } from "../adapters/db/index.js";

type ActivityType =
  | "encrypt"
  | "decrypt"
  | "seed"
  | "ner_extract"
  | "vector_search"
  | "config_update"
  | "login"
  | "user_invite";

interface LogInput {
  orgId: string;
  domainId?: string;
  userId?: string;
  type: ActivityType;
  meta?: Record<string, unknown>;
  entitiesDetected?: number;
  vectorSearches?: number;
  durationMs?: number;
}

export class ActivityService {
  constructor(private db: Db) {}

  async log(input: LogInput): Promise<void> {
    await this.db.insert(schema.activityLogs).values({
      orgId: input.orgId,
      domainId: input.domainId,
      userId: input.userId,
      type: input.type,
      meta: input.meta ?? {},
      entitiesDetected: input.entitiesDetected,
      vectorSearches: input.vectorSearches,
      durationMs: input.durationMs,
    });
  }

  async list(orgId: string, opts?: { limit?: number; domainId?: string }) {
    const conditions = [eq(schema.activityLogs.orgId, orgId)];
    if (opts?.domainId) {
      conditions.push(eq(schema.activityLogs.domainId, opts.domainId));
    }

    return this.db
      .select()
      .from(schema.activityLogs)
      .where(and(...conditions))
      .orderBy(desc(schema.activityLogs.createdAt))
      .limit(opts?.limit ?? 50);
  }

  async stats(orgId: string, since?: Date) {
    const conditions = [eq(schema.activityLogs.orgId, orgId)];
    if (since) {
      conditions.push(gte(schema.activityLogs.createdAt, since));
    }

    const logs = await this.db
      .select()
      .from(schema.activityLogs)
      .where(and(...conditions));

    const byType: Record<string, number> = {};
    let totalEntities = 0;
    let totalVectorSearches = 0;
    let totalDuration = 0;

    for (const log of logs) {
      byType[log.type] = (byType[log.type] ?? 0) + 1;
      totalEntities += log.entitiesDetected ?? 0;
      totalVectorSearches += log.vectorSearches ?? 0;
      totalDuration += log.durationMs ?? 0;
    }

    return {
      total: logs.length,
      byType,
      totalEntities,
      totalVectorSearches,
      avgDurationMs: logs.length ? Math.round(totalDuration / logs.length) : 0,
    };
  }
}
