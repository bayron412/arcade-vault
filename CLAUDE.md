# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault (`README.md`): a platform for playing games online and competing for the highest score. Currently a fresh `create-next-app` scaffold — `app/page.tsx` and `app/layout.tsx` still contain the default boilerplate and have not been customized yet.

The project follows Spec Driven Design via the `/spec` and `/spec-impl` skills from https://github.com/Klerith/fernando-skills (installed with `npx skills@latest add Klerith/fernando-skills`). Check for `.claude/skills/spec` and `.claude/skills/spec-impl` before starting feature work — if present, use them to drive the workflow instead of implementing ad hoc.

## Commands

- `npm run dev` — start the dev server (Next.js App Router, Turbopack by default)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript rules)

No test runner is configured in `package.json` yet.

## Architecture

- App Router only, under `app/`. `app/layout.tsx` defines the root HTML shell and loads the Geist Sans/Mono fonts via `next/font/google`; `app/page.tsx` is the home route.
- Styling is Tailwind CSS v4 via `@tailwindcss/postcss` (see `postcss.config.mjs`), configured CSS-first in `app/globals.css` rather than a `tailwind.config.js`.
- Path alias `@/*` maps to the repo root (`tsconfig.json`).

## Critical: this Next.js is not the one you trained on

Per `AGENTS.md`: the installed Next.js version (16.2.10) has breaking changes relative to older Next.js APIs/conventions in your training data. **Before writing any Next.js code (routing, data fetching, config, metadata, etc.), read the relevant guide in `node_modules/next/dist/docs/` first** and follow any deprecation notices found there. Key sections:

- `node_modules/next/dist/docs/01-app/` — App Router: getting started, guides, API reference
- `node_modules/next/dist/docs/02-pages/` — Pages Router (not used by this project)
- `node_modules/next/dist/docs/03-architecture/`
- `node_modules/next/dist/docs/04-community/`

Do not assume an API from an earlier Next.js version still works or is still named the same here.
