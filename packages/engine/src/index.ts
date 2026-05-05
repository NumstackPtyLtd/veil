import Fastify from "fastify";
import { createContainer } from "./container.js";
import { registerRoutes } from "./presentation/routes.js";
import { registerAuthRoutes } from "./presentation/auth-routes.js";
import { registerOrgRoutes } from "./presentation/org-routes.js";
import { migrate } from "./adapters/db/migrate.js";

async function main() {
  const {
    config,
    vectorStore,
    configStore,
    auth,
    authMiddleware,
    useCases,
    orgService,
    activity,
  } = createContainer();

  // Run migrations
  await migrate(config.databaseUrl);

  const app = Fastify({ logger: true });

  // CORS
  app.addHook("onRequest", (request, reply, done) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    reply.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Org-Id",
    );
    if (request.method === "OPTIONS") {
      reply.status(204).send();
      return;
    }
    done();
  });

  await vectorStore.initialize();
  await configStore.initialize();

  registerAuthRoutes(app, auth, activity);
  registerOrgRoutes(app, orgService, activity, authMiddleware);
  registerRoutes(app, useCases, configStore);

  await app.listen({ port: config.port, host: config.host });
}

main().catch((err) => {
  console.error("Failed to start Veil engine:", err);
  process.exit(1);
});
