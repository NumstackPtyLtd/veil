# Veil

Veil is a reversible privacy engine in the SupaProxy ecosystem. It detects personally identifiable information (PII) in text using NER (named entity recognition), replaces entities with format-preserving encrypted substitutes, and can reverse the process to restore originals. This enables AI systems to process sensitive data without exposing real PII.

See the [central hub](https://github.com/NumstackPtyLtd/supaproxy) for cross-repo governance, workflow, and conventions.

## Project structure

```
veil/
  packages/
    engine/                   Fastify API server (TypeScript)
      src/
        domain/               Types and port interfaces
        application/          Use cases (EncryptText, DecryptText, SeedEntities, OrgService, ActivityService)
        adapters/             Infrastructure implementations
          ner/                SpaCy NER adapter, pattern-based NER
          embedding/          SpaCy embedding adapter
          vector/             Qdrant vector store
          config/             Qdrant config store
          encryption/         Format-preserving encryption, AES
          auth/               JWT auth service and middleware
          db/                 PostgreSQL via Drizzle ORM (schema, migrations)
        presentation/         Route handlers (routes, auth-routes, org-routes)
        container.ts          Composition root (dependency injection)
        index.ts              Server entrypoint
      .env.example            Required environment variables
      Dockerfile              Production container
  apps/
    web/                      Astro 6 + React 19 dashboard
  services/
    spacy/                    Python FastAPI service (NER + embeddings)
      main.py                 SpaCy en_core_web_md + sentence-transformers
      Dockerfile              Production container
  docker-compose.yml          Full stack orchestration
  pnpm-workspace.yaml         pnpm workspace (apps/*, packages/*)
```

## Stack

| Layer | Tech |
|---|---|
| Engine API | Fastify + TypeScript |
| NER | SpaCy (Python, en_core_web_md) |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Vector store | Qdrant |
| Database | PostgreSQL (Drizzle ORM) |
| Auth | JWT (jose) + Argon2 |
| Encryption | Format-preserving encryption |
| Dashboard | Astro 6 + React 19 |
| Design system | @supaproxy/ui |
| Monorepo | pnpm workspace |

## Development

```bash
pnpm install
cp packages/engine/.env.example packages/engine/.env   # Fill in all values
pnpm dev:engine     # Starts the Fastify engine on port 3100
pnpm dev            # Starts the Astro dashboard
```

The SpaCy service must be running for NER and embedding features. Use Docker Compose for the full stack.

```bash
docker compose up -d
```

## Architecture

The engine follows a layered architecture with dependency injection via `container.ts`.

- `domain/` defines types and port interfaces. Imports nothing from other layers.
- `application/` contains use cases. Imports from domain only.
- `adapters/` implements port interfaces (NER, vector store, encryption, auth, database).
- `presentation/` defines HTTP route handlers. Calls application use cases.
- `container.ts` is the only place where concrete implementations are wired together.

## Environment variables

All environment variables must be set explicitly. Current defaults in `loadConfig()` should be migrated to `requireEnv()` with no fallbacks for production use.

## Git workflow

All changes go through pull requests. NEVER push directly to main.

### Branch naming

```
feat/short-description
fix/short-description
chore/short-description
docs/short-description
```

### Destructive commands

NEVER run these commands:
- `git push --force`
- `git reset --hard`
- `git clean -f`
- `rm -rf` on project directories

If something needs to be undone, create a revert commit on a branch.

## Code rules

### Type safety

- No `any` types. Define interfaces for all data structures.
- No `as any` casts.

### No hardcoded values

- No env var fallbacks. Use `requireEnv()` with no defaults.
- No hardcoded API URLs, secrets, or magic numbers.
- Timeouts, limits, and thresholds must be named constants or config values.

### Layer boundaries

- `domain/` imports nothing from application, adapters, or presentation.
- `application/` imports from `domain/` only.
- `presentation/` calls application use cases. Never imports from adapters.
- `adapters/` implements domain interfaces and application ports.
- `container.ts` is the only place where concrete implementations are instantiated.

### Writing standards

- British English throughout (colour, organisation, behaviour).
- No em dashes or en dashes. Use commas, full stops, or semicolons.
- No smart quotes. Use straight quotes only.
- Sentence case for headings.
