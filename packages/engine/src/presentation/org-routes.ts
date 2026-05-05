import type { FastifyInstance } from "fastify";
import type { OrgService } from "../application/org-service.js";
import type { ActivityService } from "../application/activity-service.js";
import type { createAuthMiddleware } from "../adapters/auth/middleware.js";

export function registerOrgRoutes(
  app: FastifyInstance,
  orgService: OrgService,
  activity: ActivityService,
  authMiddleware: ReturnType<typeof createAuthMiddleware>,
): void {
  const { authenticate, requireRole } = authMiddleware;

  // --- Organizations ---

  app.get("/orgs", { preHandler: [authenticate] }, async (request) => {
    return orgService.listOrgs(request.auth!.userId);
  });

  app.post<{ Body: { name: string; slug: string } }>(
    "/orgs",
    { preHandler: [authenticate] },
    async (request) => {
      const { name, slug } = request.body;
      return orgService.createOrg(name, slug, request.auth!.userId);
    },
  );

  app.get<{ Params: { orgId: string } }>(
    "/orgs/:orgId",
    { preHandler: [authenticate, requireRole("viewer")] },
    async (request) => {
      return orgService.getOrg(request.params.orgId);
    },
  );

  app.put<{ Params: { orgId: string }; Body: Record<string, unknown> }>(
    "/orgs/:orgId/config",
    { preHandler: [authenticate, requireRole("admin")] },
    async (request) => {
      const updated = await orgService.updateOrgConfig(
        request.params.orgId,
        request.body,
      );
      await activity.log({
        orgId: request.params.orgId,
        userId: request.auth!.userId,
        type: "config_update",
        meta: { level: "org" },
      });
      return updated;
    },
  );

  // --- Domains ---

  app.get<{ Params: { orgId: string } }>(
    "/orgs/:orgId/domains",
    { preHandler: [authenticate, requireRole("viewer")] },
    async (request) => {
      return orgService.listDomains(request.params.orgId);
    },
  );

  app.post<{
    Params: { orgId: string };
    Body: { name: string; slug: string; salt: string };
  }>(
    "/orgs/:orgId/domains",
    { preHandler: [authenticate, requireRole("admin")] },
    async (request) => {
      const { name, slug, salt } = request.body;
      return orgService.createDomain(request.params.orgId, name, slug, salt);
    },
  );

  app.get<{ Params: { orgId: string; domainId: string } }>(
    "/orgs/:orgId/domains/:domainId/config",
    { preHandler: [authenticate, requireRole("viewer")] },
    async (request) => {
      return orgService.resolveConfig(request.params.domainId);
    },
  );

  app.put<{
    Params: { orgId: string; domainId: string };
    Body: Record<string, unknown>;
  }>(
    "/orgs/:orgId/domains/:domainId/config",
    { preHandler: [authenticate, requireRole("admin")] },
    async (request) => {
      const updated = await orgService.updateDomainConfig(
        request.params.domainId,
        request.body,
      );
      await activity.log({
        orgId: request.params.orgId,
        domainId: request.params.domainId,
        userId: request.auth!.userId,
        type: "config_update",
        meta: { level: "domain" },
      });
      return updated;
    },
  );

  // --- Activity ---

  app.get<{ Params: { orgId: string }; Querystring: { limit?: string; domainId?: string } }>(
    "/orgs/:orgId/activity",
    { preHandler: [authenticate, requireRole("viewer")] },
    async (request) => {
      return activity.list(request.params.orgId, {
        limit: request.query.limit ? parseInt(request.query.limit) : 50,
        domainId: request.query.domainId,
      });
    },
  );

  app.get<{ Params: { orgId: string } }>(
    "/orgs/:orgId/stats",
    { preHandler: [authenticate, requireRole("viewer")] },
    async (request) => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return activity.stats(request.params.orgId, since);
    },
  );
}
