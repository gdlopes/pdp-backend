## Context

See `proposal.md` for motivation and `specs/gitops/spec.md` plus `specs/cd-pipeline/spec.md` for the behavior contracts.

Today: flat YAML under `infra/k8s/` applied with `kubectl` in README order. Image is `gdlopes/pdp-backend:latest` on the Deployment and the migration Job. Kind cluster `pdp-local` already maps host `3000` → node `80` for ingress-nginx. CI (`.github/workflows/ci.yaml`) is pull-request-only (lint, unit, e2e, build) and does not publish images. Daily development stays on `docker-compose.dev.yml`.

GitHub Actions cannot reach the local kind cluster. CD therefore updates git and Docker Hub only; Argo CD on the laptop applies when the operator clicks Sync.

## Goals / Non-Goals

**Goals:**

- One Kustomize root as Argo CD's renderer, with a single `images.newTag` shared by API and migration.
- Argo CD UI on the existing kind cluster with **manual** sync, so OutOfSync and the image-tag diff are visible.
- A separate CD workflow on push to `main` that publishes `gdlopes/pdp-backend:<github.sha>` and commits that tag into Kustomize.

**Non-Goals:**

- Automated Argo sync, overlays, GHCR, image updater, or GitHub webhooks into kind.
- Changing `.github/workflows/ci.yaml` or application code.
- Making the GitHub-hosted runner talk to kind.

## Decisions

### 1. Single `kustomization.yaml` in `infra/k8s/`

Keep current manifests in place. Add:

```
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - namespace.yaml
  - postgres-configmap.yaml
  - postgres-secret.yaml
  - postgres-service.yaml
  - postgres-statefulset.yaml
  - api-configmap.yaml
  - api-secret.yaml
  - migration-job.yaml
  - api-deployment.yaml
  - api-service.yaml
  - ingress.yaml
  - hpa.yaml
images:
  - name: gdlopes/pdp-backend
    newTag: latest
```

Do **not** list `kind-config.yaml`. Leave `image: gdlopes/pdp-backend:latest` in the Deployment and Job; the `images` transformer rewrites the tag at render time. Initial `newTag: latest` is bootstrap until the first CD run replaces it with a SHA.

**Alternatives considered:** `base/` + `overlays/local/` (structure for a second environment that does not exist). Directory source without Kustomize (Argo would pick up `kind-config.yaml`, which is not a cluster API object).

### 2. Argo CD is bootstrap; the Application is not part of the app Kustomize

Install Argo CD once on kind, same class as ingress-nginx / metrics-server: create namespace `argocd` and apply the upstream install manifest (stable). Then `kubectl apply` a single Application from `infra/argocd/` (path outside `infra/k8s` so Argo does not apply its own Application as part of the app tree).

```
spec:
  source:
    repoURL: https://github.com/gdlopes/pdp-backend.git
    targetRevision: HEAD
    path: infra/k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: pdp
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
```

Omit `syncPolicy.automated`. Argo detects Kustomize from `kustomization.yaml`. UI: `kubectl port-forward svc/argocd-server -n argocd 8080:443` so it does not fight host port `3000`. After Argo owns `pdp`, stop `kubectl apply` of those manifests.

The GitHub repo is public, so Argo CD clones it with no repository credential Secret.

**Alternatives considered:** Ingress `argocd.localhost` on port 3000 (host collision with the API). App-of-apps / Argo managing itself (needless for one Application). Helm source (the stack is already raw YAML).

### 3. Migration Job as a Sync hook after Postgres (not PreSync)

PreSync runs **before** any application resources. On the first Sync that would start the Job while Postgres does not exist yet; `wait-for-postgres` loops forever.

Use a **Sync** hook plus waves:

```
wave 0  namespace, Postgres, API config/secret
wave 1  Job  hook: Sync, hook-delete-policy: BeforeHookCreation
wave 2  API Deployment, Service, Ingress, HPA
```

Argo waits for wave 0 to be healthy (Postgres Ready) before creating the Job. The initContainer stays as a safety net. `BeforeHookCreation` still recreates the immutable Job on later Syncs.

**Alternatives considered:** PreSync (deadlock on first deploy). Keep the Job as a live resource and document `kubectl delete job` (fights GitOps).

### 4. Docker Hub + full `github.sha` as the image tag

Keep `gdlopes/pdp-backend` and a **public** Docker Hub repo so kind can pull without `imagePullSecret`. CD logs in with `docker/login-action@v4`, repository variable `DOCKER_USERNAME`, and secret `DOCKER_PASSWORD` (a Docker Hub access token). The production image is built and pushed with `docker/setup-qemu-action`, `docker/setup-buildx-action`, and `docker/build-push-action@v6` (`target: production`, `platforms: linux/amd64,linux/arm64`, tag `${{ github.sha }}`) so kind on Apple Silicon can pull the same tag as an amd64 cluster. Do not also push `:latest` (two tags, Argo would ignore `latest` anyway).

Order inside CD: build and push `:sha` first, then `kustomize edit set image gdlopes/pdp-backend:$SHA` in `infra/k8s`, then commit. The Kustomize commit has a different SHA; the image tag stays the **built** SHA.

**Alternatives considered:** GHCR + `GITHUB_TOKEN` (simpler auth, but the image name and likely package visibility change; private GHCR needs pull secrets on kind). Short SHA (prettier, collision risk, weaker audit). Image updater watching Docker Hub (auto-writes git; hides the CD commit the operator is meant to see).

### 5. CD workflow runs on push to `main`

New file `.github/workflows/cd.yaml`. Do not edit `ci.yaml`.

- `on.push.branches: [main]` — a merged PR is a push to `main`, so `github.sha` is the commit actually on `main`. Do not use `pull_request: types: [closed]`; that event's SHA is the PR head, not the merge commit.
- No `pull_request` trigger, so open PRs still only run CI.
- `concurrency.group: cd-${{ github.ref }}` with `cancel-in-progress: false` so two merges do not race the Kustomize commit.
- `permissions.contents: write` for the follow-up commit. Default `GITHUB_TOKEN` pushes do **not** start a new workflow run, so the pin commit cannot loop CD.
- Commit as `GitHub Action` (`action@github.com`) with a Conventional Commit subject such as `ci: pin pdp-backend image to <sha>`.
- Skip the git commit if `newTag` is already that SHA (idempotent re-run).
- Fail before any git write if docker build or push fails.
- Install Kustomize with `imranismail/setup-kustomize@v1` pinned to `5.6.0`.

The runner never calls `kubectl`. After CD, the operator Refresh + Sync in Argo (poll is ~3 minutes).

**Alternatives considered:** `workflow_dispatch` only (extra click after every merge). `pull_request` closed+merged (wrong SHA / checkout). Fold publish into `ci.yaml` (mixes PR gates with deploy). Opening a PR for the tag bump (heavier than a bot commit on a practice repo).

## Risks / Trade-offs

- **[Risk] Private Docker Hub image → kind cannot pull** → Keep the Hub repo public, as the current README already requires.
- **[Risk] Branch protection on `main` rejects the bot commit** → Practice repos typically have none. If protection is on, allow GitHub Actions or run CD from an unprotected branch.
- **[Risk] Argo poll delay hides OutOfSync** → README: click Refresh after CD, then Sync.
- **[Risk] Mixing leftover `kubectl apply` with Argo** → README must state that `pdp` is Argo-owned after bootstrap; kubectl is only for kind, ingress, metrics-server, Argo, and the Application CR.
- **[Trade-off] Manual sync** → Extra click; that is the point of the practice UI. Cloud can add `automated` later without changing Kustomize or CD.
- **[Trade-off] SHA-only tags, no `:latest` on CD** → First cluster before any CD still uses `newTag: latest` from the committed kustomization.

## Migration Plan

- Land as one PR. Merging to `main` starts CD. After that: create/reuse the kind cluster, install Argo CD, apply the Application, port-forward the UI, set `DOCKER_USERNAME` (variable) and `DOCKER_PASSWORD` (secret) on the GitHub repo if missing, Refresh + Sync in Argo.
- Rollback: delete the Application (Argo stops reconciling); optional `kind delete cluster`. Revert the PR to remove Kustomize, the CD workflow, and hook annotations. CI is untouched.
- No application schema or API migration beyond the existing Job hook running `migration:run:prod` on Sync.

## Open Questions

None.
