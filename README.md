# Job Tracker

A private, local first job application tracker built for speed during an active job search. It runs entirely on your own machine, stores everything in plain JSON files, and needs no database, no account, and no network connection.

## Overview

Job Tracker is built around one fast workflow. Instead of typing every job posting by hand, you let an LLM extract the structured data once and paste the result into the app.

1. Paste a LinkedIn or company page job posting into ChatGPT together with a templated extraction prompt (available on the in app Prompts page).
2. Copy the resulting JSON.
3. Paste it into Job Tracker. A new application is created with a resolved company, an initial status, and a cheatsheet stub.
4. Track each status transition from Saved through Applied, Phone, Interview, and Offer (or Rejected, Withdrawn, Ghosted). Every transition is written to an automatic timeline.
5. Maintain per application cheatsheets, contacts, documents, open questions, and follow up notes.

The data model separates companies from applications, so two applications at the same company share one company record while keeping their own role, recruiter, and status.

## Features

| Area | What it does |
| --- | --- |
| Paste to import | Turns extracted JSON into a full application in one step, including company resolution and salary, tech stack, requirements, and benefits fields. |
| Company resolver | Matches an incoming posting to an existing company or creates a new one, so the same employer is never duplicated. |
| Status workflow | Enforces a defined set of allowed status transitions and records each change on the timeline automatically. |
| Dashboard | Aggregate stats including totals, a conversion funnel, daily and weekly application goals, an activity chart, and average response time. |
| Applications | List, detail, create, and archive views with status, source, work mode, and rating. |
| Companies | List and detail views with size, industry, location, and linked applications. |
| Contacts and documents | Recruiters and contacts per application, plus tracked documents such as CV, cover letter, and portfolio. |
| Open questions and timeline | A running list of open questions per application and a chronological timeline of notes, emails, calls, meetings, and document events. |
| Prompts page | Ready to copy extraction prompts and a documented JSON schema example for the import workflow. |
| Export and import | Full data export and restore from the Settings page. |
| Backups | Automatic backup before destructive writes, kept per day under the data directory. |
| Theming | Dark mode by default, with a light theme, German UI strings, and a layout that stays usable on mobile. |

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | Nuxt 4 single page app, Vue 3.5, Pinia 3 |
| Styling | Tailwind CSS v4, `@nuxt/ui`, `@nuxt/icon` |
| Backend | Nuxt Nitro server routes |
| Validation and types | Zod schemas and TypeScript types in `packages/shared`, shared by frontend and backend |
| Storage | JSON files with atomic writes and daily auto backup, no database |
| Monorepo | pnpm workspaces |

## Requirements

| Tool | Version |
| --- | --- |
| Node.js | 22 or newer |
| pnpm | 10 or newer |

This project uses pnpm workspaces and is pinned to pnpm through the `packageManager` field. The internal package is linked with the `workspace:*` protocol, which npm and yarn classic do not understand, so installing with npm will fail. Use pnpm.

The simplest way to get the correct pnpm version is Corepack, which ships with Node:

```powershell
corepack enable
corepack prepare pnpm@10 --activate
```

## Getting started

```powershell
pnpm install
pnpm dev
```

Then open http://localhost:3000.

The `pnpm dev` script builds the shared package first and then starts the Nuxt dev server, so a fresh clone works without extra steps.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Build the shared package, then start the Nuxt dev server |
| `pnpm build` | Production build of shared and web |
| `pnpm preview` | Preview the production build |
| `pnpm build:shared` | Rebuild only the shared types, run this after editing `packages/shared` |
| `pnpm lint` | ESLint check |
| `pnpm lint:fix` | ESLint check with autofix |
| `pnpm format` | Prettier check |
| `pnpm format:fix` | Prettier write |
| `pnpm types:check` | TypeScript type check across the workspace |
| `pnpm clean` | Remove build artifacts and all `node_modules` |

## Project structure

```
apps/web/                 Nuxt 4 single page app and Nitro server routes
  app/                    pages, components, composables, layouts, stores
  server/                 API routes and JSON storage repositories
  data/                   JSON store files and backups (gitignored)
  i18n/                   German UI strings as typed constants
packages/shared/          Zod schemas, TypeScript types, and enums
                          (single source of truth for frontend and backend)
```

Frontend code imports the app with the `~/` alias and the shared package as `@job-tracker/shared`. After changing anything in `packages/shared`, run `pnpm build:shared` so consumers pick up the new types.

## Data and storage

All user data lives in `apps/web/data/`, which is gitignored and never leaves your machine.

| File | Contents |
| --- | --- |
| `applications.json` | All applications with embedded contacts, timeline, documents, and open questions |
| `companies.json` | Companies referenced by applications |
| `settings.json` | UI preferences and goals |
| `backups/<isoDate>/` | Automatic snapshot taken once per day before destructive writes |

Writes are atomic. The server writes to a temporary file and then renames it, so an interrupted write cannot corrupt the store. A full export and a restore are available on the Settings page.

## Conventions

Coding standards, server rules, frontend rules, and UX principles are documented in [CLAUDE.md](./CLAUDE.md). In short: TypeScript strict mode, named exports, async and await only, Tailwind classes only, all server input validated through shared Zod schemas, and all storage access through repositories rather than direct file writes.

## License

MIT, Copyright (c) 2026 WlanKabL Digital. See [LICENSE](./LICENSE).
