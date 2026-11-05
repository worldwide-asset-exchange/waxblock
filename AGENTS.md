# AGENTS.md

## Project Overview

Block explorer for the WAX blockchain.

npm monorepo: the React/Vite frontend is in `apps/web` and the
Express/Socket.IO API is in `apps/api`. Dependencies use one root `package-lock.json`.

## Core Priorities

1. Performance first.
2. Reliability first.

If a tradeoff is required, choose correctness and robustness over short-term convenience.

## Maintainability

Long term maintainability is a core priority. If you add new functionality, first check if there is shared logic that can be extracted to a separate module. Duplicate logic across multiple files is a code smell and should be avoided. Don't be afraid to change existing code. Don't take shortcuts by just adding local logic to solve a problem.

Do not use waxjs or eosjs packages for new features, use the @wharfkit/antelope and accompanying packages instead.

## Simplicity

Follow YAGNI principles, and one-liner-solutions.

Do not add helper functions or abstractions by default. Keep simple one-off logic inline.

Extract only when it clearly reduces duplication, improves readability, isolates meaningful edge cases, or matches an existing project pattern.

## Task Completion Requirements

Run commands from the repo `root` with **npm**.

- `npm run lint` and `npm run build` must pass before considering tasks completed.
  - `npm run lint` — ESLint across the monorepo.
  - `npm run build` — TypeScript + Vite production build.
- `npm test` runs the frontend and API test suites.
- Imported API lint debt is recorded in `eslint-suppressions.json`; do not
  regenerate the baseline to accept new violations.
- Use `npm run format` to apply Prettier when formatting fixes are needed.

The dev server is probably already running. If you start a new instance make sure to stop it after you're done.
