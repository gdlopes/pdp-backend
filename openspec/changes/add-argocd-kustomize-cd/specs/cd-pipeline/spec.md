## Purpose

Publishes a SHA-tagged API image and records that tag in git so Argo CD can show OutOfSync, using a GitHub Actions workflow that is started only from the Actions UI.

## ADDED Requirements

### Requirement: CD is a separate workflow started only from the Actions UI

Continuous delivery MUST live in a GitHub Actions workflow distinct from the pull-request CI workflow. The CD workflow MUST start only via `workflow_dispatch`. A push, a pull request, or a commit produced by CD MUST NOT start CD. The pull-request CI workflow MUST remain unchanged.

#### Scenario: Operator starts CD from the Actions UI

- **WHEN** an operator runs the CD workflow from the GitHub Actions UI on a branch
- **THEN** the CD workflow starts for that ref

#### Scenario: Push does not start CD

- **WHEN** a commit is pushed to `main` without `workflow_dispatch`
- **THEN** the CD workflow does not start

#### Scenario: CD commit does not start CD again

- **WHEN** CD pushes a commit that only updates the Kustomize image tag
- **THEN** that commit does not start a new CD run

#### Scenario: Pull-request CI stays the quality gate

- **WHEN** a pull request targets `main`
- **THEN** the existing CI workflow still runs lint, unit tests, e2e tests, and the production build
- **AND** that workflow does not build or push a container image

### Requirement: CD publishes a SHA-tagged image and records that tag in git

A successful CD run MUST build the production API image, push it to Docker Hub as `gdlopes/pdp-backend` tagged with the full git SHA of the commit being built, update the Kustomize `newTag` to that same SHA, and push the Kustomize change to the same ref. The image tag MUST be the SHA of the application commit that was built, not the SHA of the follow-up Kustomize commit.

#### Scenario: Successful CD run

- **WHEN** CD completes successfully for a given checkout SHA
- **THEN** Docker Hub has `gdlopes/pdp-backend` tagged with that SHA
- **AND** the repository on that ref has Kustomize `newTag` equal to that SHA
- **AND** the Kustomize commit is a distinct commit after the built SHA

#### Scenario: Build or push failure

- **WHEN** the image build or registry push fails
- **THEN** the workflow fails
- **AND** the repository is left without a CD Kustomize commit from that run
