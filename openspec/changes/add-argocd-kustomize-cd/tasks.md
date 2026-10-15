## 1. Kustomize root

- [x] 1.1 Add `infra/k8s/kustomization.yaml` listing the practice-stack manifests (namespace, Postgres, API, Job, Ingress, HPA, config, secrets) with `images.name: gdlopes/pdp-backend` and `newTag: latest`, omitting `kind-config.yaml`, and verify `kubectl kustomize infra/k8s` emits those objects, contains `gdlopes/pdp-backend:latest` on both the Deployment and the Job, and does not emit the kind Cluster spec

## 2. Migration PreSync hook

- [x] 2.1 Add Argo CD annotations `hook: PreSync` and `hook-delete-policy: BeforeHookCreation` on `infra/k8s/migration-job.yaml` without changing the wait-for-postgres initContainer, and verify the rendered Job from `kubectl kustomize infra/k8s` includes both annotations

## 3. Argo CD Application

- [x] 3.1 Add `infra/argocd/application.yaml` for Application `pdp` in namespace `argocd`, source repo `https://github.com/gdlopes/pdp-backend.git` path `infra/k8s` revision `HEAD`, destination in-cluster namespace `pdp`, `CreateNamespace=true`, and no `automated` sync policy, and verify the file is not listed in `infra/k8s/kustomization.yaml` and that YAML has no `syncPolicy.automated` key

## 4. CD workflow

- [x] 4.1 Add `.github/workflows/cd.yaml` with `on: workflow_dispatch` only, `concurrency` per ref (`cancel-in-progress: false`), and `permissions.contents: write`, and verify it is a different file from `ci.yaml` and has no `push` or `pull_request` triggers
- [x] 4.2 In that workflow, build `--target production`, tag and push `gdlopes/pdp-backend:${{ github.sha }}` using `docker/login-action@v4` with `vars.DOCKER_USERNAME` and `secrets.DOCKER_PASSWORD` and `docker/build-push-action@v6`, then run `kustomize edit set image` in `infra/k8s` with that SHA, and commit-push as `GitHub Action` with subject `ci: pin pdp-backend image to <sha>` only when `newTag` changed, and verify the job fails before any git write if build or push is ordered first and the commit step is skipped when the tag is already current
- [x] 4.3 Leave `.github/workflows/ci.yaml` unchanged and verify `git diff -- .github/workflows/ci.yaml` is empty for this change

## 5. Operator docs

- [x] 5.1 Rewrite `infra/k8s/README.md` so bootstrap is kind + ingress-nginx + metrics-server + Argo CD install + apply `infra/argocd/application.yaml` + port-forward `argocd-server` on `8080`, CD is Run workflow in Actions, and apply is Refresh then Sync in the Argo UI; document Docker Hub credentials, public GitHub and Docker Hub images, and that `pdp` is Argo-owned (no more `kubectl apply` of stack YAMLs), and verify the old ordered `kubectl apply -f infra/k8s/...` deploy section is gone
