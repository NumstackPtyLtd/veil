import type { FastifyInstance } from "fastify";
import type { AuthService } from "../adapters/auth/index.js";
import type { ActivityService } from "../application/activity-service.js";

interface SignupBody {
  email: string;
  name: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export function registerAuthRoutes(
  app: FastifyInstance,
  auth: AuthService,
  activity: ActivityService,
): void {
  app.post<{ Body: SignupBody }>("/auth/signup", async (request, reply) => {
    const { email, name, password } = request.body;
    if (!email || !name || !password) {
      return reply.status(400).send({ error: "email, name, password required" });
    }
    try {
      const result = await auth.signup(email, name, password);
      return result;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Signup failed";
      return reply.status(409).send({ error: msg });
    }
  });

  app.post<{ Body: LoginBody }>("/auth/login", async (request, reply) => {
    const { email, password } = request.body;
    if (!email || !password) {
      return reply.status(400).send({ error: "email and password required" });
    }
    try {
      const result = await auth.login(email, password);
      return result;
    } catch {
      return reply.status(401).send({ error: "Invalid credentials" });
    }
  });

  app.get("/auth/me", async (request, reply) => {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    try {
      const payload = await auth.verifyToken(header.slice(7));
      return payload;
    } catch {
      return reply.status(401).send({ error: "Invalid token" });
    }
  });
}
