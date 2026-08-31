## 1. Commitlint and commit-msg hook

- [x] 1.1 Add `@commitlint/cli`, `@commitlint/config-conventional`, and `simple-git-hooks` as devDependencies and verify `npm ci` succeeds
- [x] 1.2 Add a commitlint config that extends `@commitlint/config-conventional` and verify `echo "feat: test subject" | npx commitlint` exits 0 and `echo "add stuff" | npx commitlint` exits non-zero
- [x] 1.3 Add a `prepare` script that runs `simple-git-hooks` and configure **only** a `commit-msg` hook that runs `commitlint --edit`, then verify `.git/hooks/commit-msg` exists after `npm run prepare` and that no `pre-commit` or `pre-push` hook is installed

## 2. Cursor conventional-commits rule

- [x] 2.1 Add `.cursor/rules/conventional-commits.mdc` with `alwaysApply: true`, allowed types (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`), subject format, and a ban on `--no-verify` / `--no-gpg-sign`, and verify the file is present with that frontmatter

## 3. Lint scripts and clean check

- [x] 3.1 Split `package.json` scripts so `lint` runs ESLint without `--fix` and `lint:fix` keeps the current `--fix` behavior, then verify `npm run lint` does not rewrite files
- [x] 3.2 Run `npm run lint` and fix any existing violations (or config) until it exits 0, and verify the command is check-only and green

## 4. GitHub Actions

- [x] 4.1 Change `.github/workflows/ci.yaml` to keep `pull_request` on `main` and add separate jobs for lint (`npm run lint`), unit tests (`npm test`), and build (`npm run build`), each with checkout, Node from `.nvmrc`, and `npm ci`, and verify the workflow file defines those three jobs with that trigger only
- [x] 4.2 Add an e2e job that runs `npm run test:e2e` on `ubuntu-latest` with a generous `timeout-minutes` (Testcontainers + `postgres:16`), without a compose Postgres service, and verify the job is in the same workflow and does not depend on finishing lint/unit/build first
- [x] 4.3 Confirm a failing lint, unit, e2e, or build job fails the workflow as a whole (GitHub default: any failed job fails the run) and verify no job uses `continue-on-error: true`

## 5. Documentation

- [x] 5.1 Update `docs/development.md` (commands table, CI section) to describe Conventional Commits + the `commit-msg` hook, `lint` vs `lint:fix`, and CI running lint, unit, e2e, and build on PRs to `main`, and verify it no longer says lint/e2e are local-only
- [x] 5.2 Update `docs/testing.md` so CI is described as running unit tests, e2e, and lint (not unit-only), and verify the overview/CI sentences match the workflow
