## Purpose

Gates pull requests to `main` so lint, unit tests, end-to-end tests, and a production build must pass before merge is considered green.

## ADDED Requirements

### Requirement: Pull requests to main run the full check suite

When a pull request targets `main`, the CI workflow MUST run all of the following: lint, unit tests, end-to-end tests, and a production build. Checks MAY run in parallel. End-to-end tests MUST execute the same project e2e suite used locally.

#### Scenario: Opening a pull request against main

- **WHEN** a contributor opens or updates a pull request whose base branch is `main`
- **THEN** CI runs lint, unit tests, end-to-end tests, and a production build

#### Scenario: Push to a feature branch without a pull request

- **WHEN** a contributor pushes to a branch that is not `main` and no pull request targets `main`
- **THEN** this workflow is not required to run

### Requirement: Lint in CI does not rewrite files

Lint in CI MUST report violations and fail when any exist. It MUST NOT apply automatic fixes or commit rewritten files.

#### Scenario: Lint violation fails the workflow

- **WHEN** CI lint finds a rule violation
- **THEN** the workflow fails
- **AND** the repository files on the branch are left unchanged by lint

#### Scenario: Clean lint passes

- **WHEN** CI lint finds no violations
- **THEN** the lint check succeeds

### Requirement: Any failing check fails the workflow

If lint, unit tests, end-to-end tests, or the production build fails, the CI workflow MUST fail. A green workflow MUST mean every one of those checks succeeded.

#### Scenario: Unit tests fail

- **WHEN** unit tests exit non-zero
- **THEN** the workflow fails even if other checks would pass

#### Scenario: End-to-end tests fail

- **WHEN** end-to-end tests exit non-zero
- **THEN** the workflow fails even if lint, unit tests, and build succeed

#### Scenario: All checks succeed

- **WHEN** lint, unit tests, end-to-end tests, and the production build all succeed
- **THEN** the workflow succeeds
