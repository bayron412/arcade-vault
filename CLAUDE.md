# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — online gaming platform where users play classic arcade games and compete for points on per-game leaderboards. Uses **Spec Driven Design** via the `/spec` and `/spec-impl` skills from `npx skills@latest add Klerith/fernando-skills` (see `skills-lock.json`).

## Stack

- **Next.js 16.2.6** with App Router — read `node_modules/next/dist/docs/` before writing Next.js code; APIs differ from training data
- **React 19.2.4**
- **Tailwind CSS v4** (PostCSS plugin via `@tailwindcss/postcss`)
- **TypeScript**
- **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`) — auth + scores persistence
- **Resend** — contact form email delivery

No test runner configured.

## Skills

Usa siempre `/frontend-design` para diseñar la interfaz de usuario.

Skills locales (`.claude/skills/`), además de `spec` / `spec-impl` (Spec Driven Design, vía `skills-lock.json`):

- **`add-game`** — genera el spec de un juego canvas nuevo (`specs/NN-<slug>-game.md`); no escribe código.
- **`spec-impl-game`** — implementa un spec de juego aprobado (archivo único o carpeta `game-jam/`) y al terminar corre en secuencia los agentes `skin-designer` y `mobile-porter`.

## Agentes

- **`game-planner`** — sugiere el próximo juego a implementar eligiendo entre varios candidatos, cuando el usuario NO nombró uno concreto. Detalle: `.claude/agents/game-planner.md`.
- **`game-jam`** — recibe un tema o el nombre de un juego clásico concreto y genera los 3 specs del juego en `specs/game-jam/<game-id>/`. Detalle: `.claude/agents/game-jam.md`.
- **`skin-designer`** — garantiza al menos 4 skins en un juego ya implementado. Detalle: `.claude/agents/skin-designer.md`.
- **`mobile-porter`** — añade soporte táctil a un juego que aún no lo tiene (nunca a los 4 juegos base). Detalle: `.claude/agents/mobile-porter.md`.
- **`game-performance-booster`** — audita/optimiza el render loop Canvas 2D de un juego según `specs/12-canvas-render-performance.md`. Detalle: `.claude/agents/game-performance-booster.md`.

Regla clave: si el usuario nombra un juego concreto, siempre usa `game-jam`, nunca `game-planner` — incluso si ese juego ya figura como sugerencia pendiente en el to-do de `game-planner`.

## Architecture

App Router exclusively — no `pages/` directory.

### Routes (`app/`)

- `layout.tsx` — root layout (Geist fonts, global CSS, `UserContext` provider, `Nav`)
- `page.tsx` — home / landing
- `about/` — about + contact form
- `api/contact/` — Resend-backed contact endpoint
- `auth/` — Supabase auth page
- `games/` — games index (`GamesGrid.tsx`) + per-game routes like: `arkanoid`, `asteroids`, `snake`, `tetris`, `frogger` and more...
  (see `references/implemented-games.md`) when you need to check which games are implemented and how to implement new ones.

- `games/[id]/` — dynamic game detail with nested `play/` route
- `hall-of-fame/` — leaderboard / scores
- `context/UserContext.tsx` — client-side auth user context
- `data/` — static catalog: `games.ts`, `scores.ts`, `index.ts`
- `RevealObserver.tsx` — scroll-reveal animations

### Shared code

- `components/Nav.tsx` — top navigation
- `components/games/` — canvas game implementations (`ArkanoidGame`, `AsteroidsGame`, `SnakeGame`, `TetrisGame`, `FroggerGame`), shared `GameOverActions.tsx`, and per-game asset subfolders (e.g. `arkanoid/spritesheet.ts`)
- `lib/supabase/` — `client.ts` (browser), `server.ts` (RSC/route handlers), `types.ts` (DB types)
- `public/` — sprite sheets (`spritesheet-breakout.png`, `fruits.png`) and audio (`ball-bounce.mp3`, `break-sound.mp3`)

### Specs

`specs/` holds the spec-driven design history, plus `specs/game-jam` for thematic jams.

## Conventions

- Server Components by default; add `"use client"` only when needed (game canvases, auth context, interactive forms).
- New routes: folder under `app/` with `page.tsx`.
- Shared UI in `components/`; game logic colocated in `components/games/<Game>.tsx`.
- Supabase: import from `lib/supabase/server` in RSC / route handlers, `lib/supabase/client` in client components.
- New games follow the existing pattern: spec in `specs/`, canvas component in `components/games/`, route under `app/games/<name>/`, score writes through `lib/supabase`.
