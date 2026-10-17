# Local Kubernetes environment (kind)

Practice environment with **API + Postgres** on a kind cluster, reconciled by **Argo CD** from git (Kustomize). Daily development still uses `docker-compose.dev.yml`.

After bootstrap, namespace `pdp` is **Argo-owned**. Do not `kubectl apply` the stack YAMLs under `infra/k8s/` — that fights Argo's tracking. `kubectl` is only for kind, ingress-nginx, metrics-server, Argo CD itself, and the Application CR.

## Prerequisites

- [Docker](https://www.docker.com/)
- [kind](https://kind.sigs.k8s.io/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- A [Docker Hub](https://hub.docker.com/) account with a **public** `pdp-backend` repository (kind pulls without `imagePullSecrets`)
- GitHub Actions: repository variable `DOCKER_USERNAME` and secret `DOCKER_PASSWORD` (a Docker Hub [access token](https://docs.docker.com/security/access-tokens/), not the account password)

## Bootstrap (once)

### 1. Create the kind cluster

```bash
kind create cluster --name pdp-local --config infra/k8s/kind-config.yaml
```

### 2. Install Ingress NGINX

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod -l app.kubernetes.io/component=controller --timeout=120s
```

### 3. Install metrics-server (HPA)

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl patch deployment metrics-server -n kube-system --type=json \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
```

### 4. Install Argo CD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl wait --namespace argocd \
  --for=condition=available deployment/argocd-server --timeout=180s
```

### 5. Register the Application (manual sync)

```bash
kubectl apply -f infra/argocd/application.yaml
```

This points Argo CD at `infra/k8s` (Kustomize). It does **not** enable automated sync. The cluster stays unchanged until you click Sync in the UI.

### 6. Open the Argo CD UI

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

UI: https://localhost:8080 (accept the local TLS warning).

Username: `admin`. Password:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo
```

The API Ingress stays on http://localhost:3000. The UI uses port-forward `8080` so the two do not share a host port.

## CD (on merge to `main`)

1. Merge a pull request into `main` (that push starts **CD - workflow**).
2. The job builds `--target production` for `linux/amd64` and `linux/arm64`, pushes `gdlopes/pdp-backend:<github.sha>` to Docker Hub, runs `kustomize edit set image` in `infra/k8s`, and commits `ci: pin pdp-backend image to <sha>` when `newTag` changed. Argo deploys that `newTag`, not whatever commit is checked out locally.
3. In Argo CD: **Refresh** (poll is ~3 minutes) → Application is OutOfSync → **Sync**.

The GitHub-hosted runner never talks to kind. CD only updates git and Docker Hub. Sync in the UI is what applies the cluster.

The follow-up Kustomize commit uses `GITHUB_TOKEN`, so it does **not** start another CD run. Pull requests still run **CI** only; they do not publish an image.

## Verify

After a successful Sync:

```bash
kubectl -n pdp get pods,svc,statefulset,pvc,ingress,hpa
curl http://localhost:3000/healthcheck/readiness
curl http://localhost:3000/healthcheck/liveness
```

Swagger: http://localhost:3000/api/docs

## Teardown

```bash
kind delete cluster --name pdp-local
```

> This deletes the cluster and all PVCs. Postgres data will be lost.

## Manifest layout

| File | Resource |
|---------|---------|
| `kustomization.yaml` | Kustomize root (resources + `images.newTag`) |
| `namespace.yaml` | Namespace `pdp` |
| `postgres-configmap.yaml` | Postgres ConfigMap |
| `postgres-secret.yaml` | Postgres Secret |
| `postgres-service.yaml` | Headless Service |
| `postgres-statefulset.yaml` | StatefulSet + PVC |
| `api-configmap.yaml` | API environment variables |
| `api-secret.yaml` | Database password and JWT_ACCESS_SECRET |
| `migration-job.yaml` | Migration Job (Argo Sync hook, after Postgres) |
| `api-deployment.yaml` | API Deployment with probes |
| `api-service.yaml` | ClusterIP :3000 |
| `ingress.yaml` | Ingress `localhost:3000` |
| `hpa.yaml` | HorizontalPodAutoscaler |
| `kind-config.yaml` | kind cluster configuration (not a Kustomize resource) |

Argo CD Application CR (bootstrap only, not part of the app Kustomize): `infra/argocd/application.yaml`.
