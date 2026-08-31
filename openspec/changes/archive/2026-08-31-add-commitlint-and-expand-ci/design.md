## Context

See `proposal.md` for motivation and `specs/commit-conventions/spec.md` plus `specs/ci-pipeline/spec.md` for the behavior contracts.

Today: mixed commit subjects, no `commit-msg` hook, no commitlint, no `.cursor/rules/`. `.github/workflows/ci.yaml` runs `npm ci`, `npm test`, and `npm run build` on pull requests to `main` only. `npm run lint` uses `--fix`. E2E (`npm run test:e2e`) uses Testcontainers (`postgres:16`, `maxWorkers: 1`, 120s startup) and is documented as local-only. Commits in this repo are often created by Cursor via `git commit -m`, so an interactive commit wizard would never run.

## Goals / Non-Goals

**Goals:**

- Make Conventional Commits the only path through `git commit` (human or agent) with a fast local check.
- Give Cursor an always-on rule so most messages pass that check on the first try.
- Make PR CI the quality gate: lint (check-only), unit tests, e2e, build.
- Keep local hooks limited to `commit-msg` so day-to-day `git push` stays unchanged.

**Non-Goals:**

- Commitizen / cz prompts, lint-staged, pre-push test hooks.
- Changelog, semantic-release, or linting GitHub PR titles.
- Enabling GitHub branch protection (manual repo setting).
- Changing Nest modules, HTTP APIs, or test fixtures except as needed to make lint/e2e pass on CI.

## Decisions

### 1. commitlint + `simple-git-hooks` on `commit-msg` only

Use `@commitlint/cli` with `@commitlint/config-conventional` and a `commitlint.config.*` that extends that preset (default ignore list already skips merge commits such as `Merge pull request #N`).

Install hooks with `simple-git-hooks`, not husky: one `package.json` field and a `prepare` script. Wire only:

```
commit-msg: npx --no -- commitlint --edit $1
```

No `pre-commit`, no `pre-push`.

**Alternatives considered:** husky (more ceremony, same result). lefthook (YAML, extra binary). CI-only commitlint (too late; Cursor would land bad commits then fail on GitHub). Commitizen (interactive; unused by Cursor).

### 2. Always-on Cursor rule, not a skill

Add `.cursor/rules/conventional-commits.mdc` with `alwaysApply: true`. Commits happen regardless of which files are open, so globs are the wrong trigger. The rule MUST:

- Require `type(optional-scope): summary` in English, imperative, ~72 characters for the subject.
- List the conventional types this repo will use (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`).
- Tell the agent not to pass `--no-verify` / `--no-gpg-sign`.
- Stay short; do not duplicate the full git safety protocol from user rules.

**Alternative considered:** a Cursor skill invoked only when committing. Rejected — skills are opt-in; `alwaysApply` is how we actually catch agent commits.

### 3. Split lint scripts

| Script | Command | Who |
|--------|---------|-----|
| `lint` | ESLint **without** `--fix` | CI and local check |
| `lint:fix` | current `--fix` behavior | local rewrite |

CI MUST call `npm run lint`. Existing `docs/development.md` examples that imply `--fix` should point at `lint:fix`.

**Alternative considered:** keep `--fix` on `lint` and run a raw `npx eslint` in CI. Rejected — two different commands drift; the named script is the contract.

### 4. CI: keep PR-to-`main` trigger; split jobs

Keep `on.pull_request.branches: [main]`. Do not add `push` for every feature branch (spec: not required without a PR).

Split the current single job so failures isolate and lint/unit/build do not wait on Testcontainers:

```
lint          unit          build
  |             |             |
  +------+------+-------------+
         |
        e2e     (own job, needs Docker; can start in parallel with the others)
```

Shared setup per job: checkout, Node from `.nvmrc`, `npm ci`. E2E job runs `npm run test:e2e` on `ubuntu-latest` (Docker is available; no compose Postgres service — Testcontainers starts its own). Give the e2e job a generous timeout (image pull + per-file 120s). Sequential e2e (`maxWorkers: 1`) stays as in `test/jest-e2e.json`.

**Alternatives considered:** one sequential job (simpler, slower, worse signal). `push` to all branches (extra minutes for no PR). A GitHub Actions Postgres service instead of Testcontainers (would diverge from local e2e).

### 5. Docs follow the pipeline

Update `docs/development.md` (CI section, lint command table) and `docs/testing.md` (CI runs unit only / e2e local-only). Mention how to commit (`git commit` as usual; hook runs commitlint) so contributors are not pointed at Commitizen.

## Risks / Trade-offs

- **[Risk] `npm run lint` without `--fix` fails on existing files** → During apply, run lint check-only first; fix violations (or justify config) until CI would pass. Do not leave `--fix` as the CI command.
- **[Risk] E2E on GitHub is slower/flakier (Postgres image pull, Testcontainers Ryuk)** → Dedicated job + higher `timeout-minutes`. If Ryuk misbehaves on the runner, set `TESTCONTAINERS_RYUK_DISABLED=true` only if needed. Keep `maxWorkers: 1`.
- **[Risk] `simple-git-hooks` `prepare` runs on `npm ci` in CI** → Harmless; hooks on the runner do not affect GitHub’s merge. Do not skip `prepare` globally.
- **[Risk] History is not rewritten** → Old free-form commits stay. Enforcement is forward-only. Default commitlint ignores merge commits, so GitHub “Create a merge commit” remains usable.
- **[Risk] Agent or human uses `--no-verify`** → Cursor rule and user git rules forbid it; we cannot technically prevent it. CI still catches lint/test failures, not commit message format on GitHub (PR-title lint is out of scope).
- **[Trade-off] No PR-title check** → Squash-merge could put a non-conventional title on `main`. Current workflow uses merge commits; if squash becomes default later, add a semantic PR-title action.

## Migration Plan

- Land as a single PR on a feature branch. After merge, new commits on every clone need `npm install` / `npm ci` so `prepare` installs the `commit-msg` hook.
- No production deploy, schema, or API migration.
- Rollback: revert the PR (remove hook, commitlint, extra CI jobs, Cursor rule). GitHub will stop running the extra checks; old commits are unaffected.

## Open Questions

None. Branch protection remains a manual GitHub setting after this change ships.
