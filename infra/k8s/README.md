# Ambiente Kubernetes local (kind)

Ambiente de prática com **API + Postgres** rodando no cluster kind. O desenvolvimento diário continua via `docker-compose.dev.yml`.

## Pré-requisitos

- [Docker](https://www.docker.com/)
- [kind](https://kind.sigs.k8s.io/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- Conta no [Docker Hub](https://hub.docker.com/)

## 1. Publicar imagem da API

Substitua `YOUR_DOCKERHUB_USER` nos manifestos `api-deployment.yaml` e `migration-job.yaml` pelo seu usuário do Docker Hub.

```bash
docker login
docker build --target production -t YOUR_DOCKERHUB_USER/pdp-backend:latest .
docker push YOUR_DOCKERHUB_USER/pdp-backend:latest
```

> Repositório **público** dispensa `imagePullSecrets`. Para repositório privado, crie um secret no namespace `pdp`.

## 2. Criar cluster kind

```bash
kind create cluster --name pdp-local --config infra/k8s/kind-config.yaml
```

## 3. Instalar Ingress NGINX

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod -l app.kubernetes.io/component=controller --timeout=120s
```

## 4. Instalar metrics-server (HPA)

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl patch deployment metrics-server -n kube-system --type=json \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
```

## 5. Deploy da stack

```bash
# Namespace
kubectl apply -f infra/k8s/namespace.yaml

# Postgres (StatefulSet)
kubectl apply -f infra/k8s/postgres-configmap.yaml
kubectl apply -f infra/k8s/postgres-secret.yaml
kubectl apply -f infra/k8s/postgres-service.yaml
kubectl apply -f infra/k8s/postgres-statefulset.yaml
kubectl -n pdp rollout status statefulset/postgres --timeout=120s

# Config da API
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

## 6. Verificar

```bash
kubectl -n pdp get pods,svc,statefulset,pvc,ingress,hpa
curl http://localhost:3000/healthcheck/readiness
curl http://localhost:3000/healthcheck/liveness
```

Swagger: http://localhost:3000/api/docs

## Atualizar após mudança de código

```bash
docker build --target production -t YOUR_DOCKERHUB_USER/pdp-backend:latest .
docker push YOUR_DOCKERHUB_USER/pdp-backend:latest
kubectl -n pdp rollout restart deployment/pdp-api
```

## Atualizar após nova migration

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

> Isso remove o cluster e todos os PVCs. Os dados do Postgres serão perdidos.

## Estrutura dos manifestos

| Arquivo | Recurso |
|---------|---------|
| `namespace.yaml` | Namespace `pdp` |
| `postgres-configmap.yaml` | ConfigMap do Postgres |
| `postgres-secret.yaml` | Secret do Postgres |
| `postgres-service.yaml` | Headless Service |
| `postgres-statefulset.yaml` | StatefulSet + PVC |
| `api-configmap.yaml` | Variáveis de ambiente da API |
| `api-secret.yaml` | Senha do banco |
| `migration-job.yaml` | Job de migrations |
| `api-deployment.yaml` | Deployment da API com probes |
| `api-service.yaml` | ClusterIP :3000 |
| `ingress.yaml` | Ingress `localhost:3000` |
| `hpa.yaml` | HorizontalPodAutoscaler |
| `kind-config.yaml` | Configuração do cluster kind |
