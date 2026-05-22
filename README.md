# Job Tracker

> Private, local-first job application tracker — built for speed during an active job search.

The core loop: paste a LinkedIn or company-page posting into ChatGPT with a templated extraction prompt → copy the resulting JSON → paste into Job Tracker → entry created with smart company resolver, status workflow, cheatsheet stub.

## Stack

- **Frontend:** Nuxt 4 SPA + Vue 3.5 + Pinia 3 + Tailwind v4 + `@nuxt/ui` + `@nuxt/icon`
- **Backend:** Nuxt Nitro server routes
- **Storage:** JSON files with atomic writes + auto-backup (no database)
- **Shared types:** Zod schemas + TypeScript types in `packages/shared`
- **Monorepo:** pnpm workspaces

## Quick start

```powershell
pnpm install
pnpm dev
```

Then open <http://localhost:3000>.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Build shared + start Nuxt dev server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm build:shared` | Rebuild shared types (run after editing `packages/shared`) |
| `pnpm lint` / `pnpm lint:fix` | ESLint |
| `pnpm format` / `pnpm format:fix` | Prettier |
| `pnpm types:check` | TypeScript type check |
| `pnpm clean` | Wipe `node_modules` + build artifacts |

## Project structure

```
apps/web/             Nuxt 4 SPA + Nitro server routes
  app/                pages, components, composables, layouts, stores
  server/             API routes + JSON storage repositories
  data/               JSON store files (gitignored)
  i18n/               German strings (typed constants, no vue-i18n)
packages/shared/      Zod schemas + TS types + enums (FE/BE single source of truth)
```

## Data

User data lives in `apps/web/data/` (gitignored):

- `applications.json` — all applications with embedded contacts/timeline/documents
- `companies.json` — companies referenced by applications
- `settings.json` — UI preferences
- `backups/<isoDate>/` — auto-backup before destructive writes

Full export/import via `/settings` page.

## Conventions

See [CLAUDE.md](./CLAUDE.md).
