# cd-pipeline Specification

## Purpose

Publishes a SHA-tagged API image and records that tag in git so Argo CD can show OutOfSync, using a GitHub Actions workflow that runs when changes land on `main`.

## Requirements

### Requirement: CD is a separate workflow that runs when main is updated

Continuous delivery MUST live in a GitHub Actions workflow distinct from the pull-request CI workflow. The CD workflow MUST start on a push to `main` (including a merged pull request). Opening or updating a pull request MUST NOT start CD. A commit produced by CD that only updates the Kustomize image tag MUST NOT start a new CD run. The pull-request CI workflow MUST remain unchanged.

#### Scenario: Merged pull request starts CD

- **WHEN** a pull request is merged into `main`
- **THEN** the CD workflow starts for the resulting commit on `main`

#### Scenario: Open pull request does not start CD

- **WHEN** a contributor opens or updates a pull request whose base branch is `main`
- **THEN** the CD workflow does not start
- **AND** the existing CI workflow still runs lint, unit tests, e2e tests, and the production build
- **AND** that CI workflow does not build or push a container image

#### Scenario: CD commit does not start CD again

- **WHEN** CD pushes a commit that only updates the Kustomize image tag
- **THEN** that commit does not start a new CD run

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
