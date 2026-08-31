# Local Kubernetes environment (kind)

Practice environment with **API + Postgres** running on a kind cluster. Daily development still uses `docker-compose.dev.yml`.

## Prerequisites

- [Docker](https://www.docker.com/)
- [kind](https://kind.sigs.k8s.io/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- A [Docker Hub](https://hub.docker.com/) account

## 1. Publish the API image

Replace `YOUR_DOCKERHUB_USER` in the `api-deployment.yaml` and `migration-job.yaml` manifests with your Docker Hub username.

```bash
docker login
docker build --target production -t YOUR_DOCKERHUB_USER/pdp-backend:latest .
docker push YOUR_DOCKERHUB_USER/pdp-backend:latest
```

> A **public** repository does not need `imagePullSecrets`. For a private repository, create a secret in the `pdp` namespace.

## 2. Create the kind cluster

```bash
kind create cluster --name pdp-local --config infra/k8s/kind-config.yaml
```

## 3. Install Ingress NGINX

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod -l app.kubernetes.io/component=controller --timeout=120s
```

## 4. Install metrics-server (HPA)

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl patch deployment metrics-server -n kube-system --type=json \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
```

## 5. Deploy the stack

```bash
# Namespace
kubectl apply -f infra/k8s/namespace.yaml

# Postgres (StatefulSet)
kubectl apply -f infra/k8s/postgres-configmap.yaml
kubectl apply -f infra/k8s/postgres-secret.yaml
kubectl apply -f infra/k8s/postgres-service.yaml
kubectl apply -f infra/k8s/postgres-statefulset.yaml
kubectl -n pdp rollout status statefulset/postgres --timeout=120s

# API config
kubectl apply -f infra/k8s/api-configmap.yaml
kubectl apply -f infra/k8s/api-secret.yaml

# Migrations
kubectl apply -f infra/k8s/migration-job.yaml
kubectl -n pdp wait --for=condition=complete job/pdp-api-migration --timeout=180s

# API + Ingress + HPA
kubectl apply -f infra/k8s/api-deployment.yaml
kubectl apply -f infra/k8s/api-service.yaml
kubectl apply -f infra/k8s/ingress.yaml
kubectl apply -f infra/k8s/hpa.yaml
```

## 6. Verify

```bash
kubectl -n pdp get pods,svc,statefulset,pvc,ingress,hpa
curl http://localhost:3000/healthcheck/readiness
curl http://localhost:3000/healthcheck/liveness
```

Swagger: http://localhost:3000/api/docs

## Update after a code change

```bash
docker build --target production -t YOUR_DOCKERHUB_USER/pdp-backend:latest .
docker push YOUR_DOCKERHUB_USER/pdp-backend:latest
kubectl -n pdp rollout restart deployment/pdp-api
```

## Update after a new migration

```bash
docker build --target production -t YOUR_DOCKERHUB_USER/pdp-backend:latest .
docker push YOUR_DOCKERHUB_USER/pdp-backend:latest
kubectl -n pdp delete job pdp-api-migration
kubectl apply -f infra/k8s/migration-job.yaml
kubectl -n pdp wait --for=condition=complete job/pdp-api-migration --timeout=180s
kubectl -n pdp rollout restart deployment/pdp-api
```

## Teardown

```bash
kind delete cluster --name pdp-local
```

> This deletes the cluster and all PVCs. Postgres data will be lost.

## Manifest layout

| File | Resource |
|---------|---------|
| `namespace.yaml` | Namespace `pdp` |
| `postgres-configmap.yaml` | Postgres ConfigMap |
| `postgres-secret.yaml` | Postgres Secret |
| `postgres-service.yaml` | Headless Service |
| `postgres-statefulset.yaml` | StatefulSet + PVC |
| `api-configmap.yaml` | API environment variables |
| `api-secret.yaml` | Database password |
| `migration-job.yaml` | Migration Job |
| `api-deployment.yaml` | API Deployment with probes |
| `api-service.yaml` | ClusterIP :3000 |
| `ingress.yaml` | Ingress `localhost:3000` |
| `hpa.yaml` | HorizontalPodAutoscaler |
| `kind-config.yaml` | kind cluster configuration |
