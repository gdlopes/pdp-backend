## Why

Commit messages are inconsistent (some Conventional Commits, many free-form), and nothing rejects a bad message. CI on pull requests to `main` only runs unit tests and a build, so lint and e2e regressions can merge. We want a small, enforceable pipeline: Conventional Commits at commit time, and lint plus e2e on GitHub.

## What Changes

- Enforce Conventional Commits with commitlint (`@commitlint/config-conventional`) on `git commit` via a `commit-msg` hook only (`simple-git-hooks`). No Commitizen, no pre-commit lint-staged, no pre-push tests.
- Add an always-on Cursor project rule so the agent writes Conventional Commit messages (this repo’s commits are often authored in Cursor, which never sees an interactive commit wizard).
- Split `npm run lint` so CI checks without `--fix`, and keep a local `lint:fix` for rewriting.
- Extend `.github/workflows/ci.yaml` so pull requests to `main` also run ESLint and `npm run test:e2e` (Testcontainers on `ubuntu-latest`), in addition to unit tests and build.
- Update `docs/development.md` and `docs/testing.md` so they no longer say lint and e2e are local-only.

## Capabilities

### New Capabilities

- `commit-conventions`: Git commits MUST follow Conventional Commits. Invalid subjects are rejected at commit time. Cursor is instructed to produce that format.
- `ci-pipeline`: Pull requests targeting `main` MUST run lint, unit tests, e2e tests, and build. Any failing check MUST fail the workflow.

### Modified Capabilities

- None.

## Impact

- New devDependencies: `@commitlint/cli`, `@commitlint/config-conventional`, `simple-git-hooks`.
- New files: `commitlint.config.*`, `.cursor/rules/` conventional-commits rule, hook wiring in `package.json` (`prepare` / `simple-git-hooks`).
- `package.json` scripts: lint split (`lint` vs `lint:fix`); no application API or Nest modules change.
- `.github/workflows/ci.yaml`: additional jobs/steps; e2e needs Docker (already on GitHub-hosted runners).
- Docs: `docs/development.md`, `docs/testing.md`.
- Out of scope: Commitizen, local pre-push tests, changelog/semantic-release, PR-title lint, branch-protection GitHub settings (repo config, not code).
