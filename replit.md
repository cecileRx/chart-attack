# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### ChartAttack — Educational Chart Analysis Assistant (`artifacts/chart-analyzer`)
- **Route**: `/` (root)
- **Type**: react-vite, frontend-only (no backend needed)
- **Purpose**: Educational tool for beginner traders. Import a chart image, receive a simulated trade plan with entry, SL, TP1/TP2/TP3, RR ratio, and educational commentary. Canvas overlay draws visual annotations. Manual mode allows adjusting levels. Session history stored in localStorage.
- **Key modules**:
  - `src/lib/analyzeChart.ts` — core analysis engine (heuristic, AI-replaceable)
  - `src/lib/renderAnnotations.ts` — canvas overlay drawing
  - `src/lib/sessionHistory.ts` — in-memory/localStorage session history
  - `src/pages/Home.tsx` — landing page
  - `src/pages/Analyze.tsx` — main analysis workspace
  - `src/pages/History.tsx` — session history grid
- **Features**: Dark/light mode, drag-and-drop chart import, automatic and manual analysis modes, export annotated chart as PNG, compliance disclaimers
