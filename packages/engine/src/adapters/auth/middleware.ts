import type { FastifyRequest, FastifyReply } from "fastify";
import type { AuthService, AuthPayload } from "./index.js";
import type { Db } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { schema } from "../db/index.js";

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthPayload & { orgId?: string; role?: string };
  }
}

type Role = "owner" | "admin" | "member" | "viewer";

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export function createAuthMiddleware(authService: AuthService, db: Db) {
  async function authenticate(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      reply.status(401).send({ error: "Unauthorized" });
      return;
    }

    try {
      const payload = await authService.verifyToken(header.slice(7));
      request.auth = payload;
    } catch {
      reply.status(401).send({ error: "Invalid token" });
    }
  }

  function requireRole(minRole: Role) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.auth) {
        reply.status(401).send({ error: "Unauthorized" });
        return;
      }

      const orgId =
        (request.params as Record<string, string>).orgId ??
        (request.headers["x-org-id"] as string);

      if (!orgId) {
        reply.status(400).send({ error: "Organization context required" });
        return;
      }

      const [membership] = await db
        .select()
        .from(schema.memberships)
        .where(
          and(
            eq(schema.memberships.userId, request.auth.userId),
            eq(schema.memberships.orgId, orgId),
          ),
        )
        .limit(1);

      if (!membership) {
        reply.status(403).send({ error: "Not a member of this organization" });
        return;
      }

      if (ROLE_HIERARCHY[membership.role] < ROLE_HIERARCHY[minRole]) {
        reply.status(403).send({ error: `Requires ${minRole} role or above` });
        return;
      }

      request.auth.orgId = orgId;
      request.auth.role = membership.role;
    };
  }

  return { authenticate, requireRole };
}
