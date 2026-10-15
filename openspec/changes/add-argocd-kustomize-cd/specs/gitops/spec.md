## Purpose

Lets a local kind cluster reconcile the API stack from git through Argo CD, using Kustomize as the desired-state renderer and leaving apply under an explicit Sync in the UI.

## ADDED Requirements

### Requirement: Kustomize selects cluster resources and pins the API image

The repository MUST provide a Kustomize root whose resources are the Kubernetes objects of the practice stack (namespace, Postgres, API, migration Job, Ingress, HPA, config, and secrets). The kind cluster specification MUST NOT be a Kustomize resource. The Kustomize root MUST pin the API image name `gdlopes/pdp-backend` with an `images` `newTag` so that both the API workload and the migration Job receive the same tag when the desired state is rendered.

#### Scenario: Rendered desired state excludes kind cluster config

- **WHEN** the Kustomize root is built
- **THEN** the output includes the practice-stack objects
- **AND** the output does not include the kind cluster specification

#### Scenario: Image tag applies to API and migration

- **WHEN** `newTag` is set to a given value
- **THEN** the rendered API workload and the rendered migration Job both use `gdlopes/pdp-backend` with that tag

### Requirement: Argo CD compares Kustomize desired state and syncs only when requested

Argo CD on the kind cluster MUST treat the Kustomize root as the Application source for namespace `pdp`. Sync MUST be manual: a new commit in git MUST NOT apply to the cluster until an operator requests Sync. The Application MUST NOT enable automated sync.

#### Scenario: Git tag change appears as OutOfSync

- **WHEN** git contains a new `newTag` and Argo CD has refreshed from the repository
- **THEN** the Application is OutOfSync
- **AND** live objects in the cluster are unchanged until Sync is requested

#### Scenario: Operator Sync applies desired state

- **WHEN** an operator requests Sync while the Application is OutOfSync
- **THEN** Argo CD applies the Kustomize desired state to namespace `pdp`

#### Scenario: Automated sync stays off

- **WHEN** the Application manifest is inspected
- **THEN** it does not enable automated sync

### Requirement: Migration runs as a PreSync hook

The migration Job MUST be declared as an Argo CD PreSync hook with a delete policy that recreates the Job on the next Sync. A Sync MUST NOT fail because Kubernetes rejected an in-place Job spec update.

#### Scenario: Second Sync recreates the migration Job

- **WHEN** an operator Syncs after a previous Sync already created and completed the migration Job
- **THEN** Argo CD recreates the Job rather than patching the existing Job
- **AND** the new Job uses the image tag from the current desired state
