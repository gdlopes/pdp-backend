## Why

The kind stack is a practice environment deployed with ordered `kubectl apply` and `:latest` plus a rollout restart. There is no way to see desired vs live state in a GitOps UI, and no CD path that publishes an immutable image tag into git. We want that loop for learning: CD publishes on merge to `main`, Argo Sync stays a click in the UI.

## What Changes

- Add a single `infra/k8s/kustomization.yaml` that lists cluster resources (excluding `kind-config.yaml`) and pins `gdlopes/pdp-backend` via `images.newTag`.
- Install Argo CD on the existing kind cluster as bootstrap (same class as ingress-nginx). Point one Application at this repo path `infra/k8s` with Kustomize as the source and **manual** sync.
- Treat the migration Job as an Argo PreSync hook so a Sync recreates it instead of trying to mutate an immutable Job.
- Add a separate GitHub Actions workflow (not `ci.yaml`) triggered on push to `main` (merged PRs): build and push the production image tagged with the checkout `github.sha`, run `kustomize edit set image`, commit and push the tag change.
- Document bootstrap vs CD vs Argo Sync in `infra/k8s/README.md`. Keep daily development on `docker-compose.dev.yml`.

## Capabilities

### New Capabilities

- `gitops`: Local kind GitOps with Kustomize as Argo CD's desired-state renderer, one Application on path `infra/k8s`, manual sync, and migration as a PreSync hook.
- `cd-pipeline`: A GitHub Actions CD workflow, separate from PR CI, started on push to `main`. It publishes a SHA-tagged image, updates `kustomization.yaml`, and pushes that commit so Argo can show OutOfSync.

### Modified Capabilities

- None. `ci-pipeline` stays pull-request gates only (lint, unit, e2e, build). CD must not be folded into that workflow.

## Impact

- New files: `infra/k8s/kustomization.yaml`, Argo CD Application manifest under `infra/` (outside the app Kustomize), `.github/workflows/cd.yaml`.
- Existing manifests under `infra/k8s/` stay the resource source; the Job gains Argo hook annotations. Image name stays `gdlopes/pdp-backend` (Docker Hub, public).
- `infra/k8s/README.md` becomes the operator guide for bootstrap, CD, and manual Sync. Application code, Nest modules, and `.github/workflows/ci.yaml` are unchanged.
- GitHub Actions: repository variable `DOCKER_USERNAME` and secret `DOCKER_PASSWORD` for the CD workflow.
- Out of scope: Argo auto-sync, Kustomize overlays, GHCR, image updater, webhooks into kind, publishing images on pull requests, changing CI, production/cloud cluster.
