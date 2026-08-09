# ☸️ Kubernetes Manifests — E-Commerce Microservices

This directory contains all Kubernetes manifests required to deploy the e-commerce microservices application on a Kubernetes cluster (tested with **K3s** and **AWS EKS**).

---

## 📁 Directory Structure

```
k8s/
├── frontend/
│   ├── deployment.yml        # Frontend Nginx deployment (3 replicas)
│   ├── svc.yml               # ClusterIP / LoadBalancer service
│   ├── ingress.yml           # NGINX Ingress to expose the app externally
│   ├── frontend-config.yml   # ConfigMap with backend API URL
│   └── hpa.yml               # HorizontalPodAutoscaler (2–10 replicas)
│
├── product-service/
│   ├── deployment.yml        # Product service deployment (port 8081)
│   ├── service.yml           # ClusterIP service
│   └── hpa.yml               # HorizontalPodAutoscaler
│
├── cart-service/
│   ├── deployment.yml        # Cart service deployment (3 replicas, port 8082)
│   ├── service.yml           # ClusterIP service
│   └── hpa.yml               # HorizontalPodAutoscaler
│
├── inventory-service/
│   ├── deployment.yml        # Inventory service deployment (port 8083)
│   ├── service.yml           # ClusterIP service
│   └── hpa.yml               # HorizontalPodAutoscaler
│
└── database/
    ├── deployment.yml        # PostgreSQL StatefulSet (2 replicas, gp2 PVC)
    ├── service.yml           # Headless ClusterIP service
    └── secrets.yml           # Kubernetes Secret for DB credentials
```

---

## 🧩 Services Overview

| Service            | Image                                          | Container Port | Replicas |
|--------------------|------------------------------------------------|----------------|----------|
| **Frontend**       | `ghcr.io/gamal0909/frontend-service:latest`    | `80`           | 3        |
| **Product Service**| `ghcr.io/gamal0909/product-service:latest`     | `8081`         | Dynamic (HPA) |
| **Cart Service**   | `ghcr.io/gamal0909/cart-service:latest`        | `8082`         | 3        |
| **Inventory Svc**  | `ghcr.io/gamal0909/inventory-service:latest`   | `8083`         | Dynamic (HPA) |
| **PostgreSQL DB**  | `postgres:latest`                              | `5432`         | 2 (StatefulSet) |

---

## ⚙️ Prerequisites

Before deploying, make sure you have:

- A running Kubernetes cluster (K3s, EKS, GKE, etc.)
- `kubectl` configured to point to your cluster
- **NGINX Ingress Controller** installed
- A **StorageClass** named `gp2` available (for PostgreSQL PVC — AWS EKS default)
- Container images pushed to GHCR (`ghcr.io/gamal0909/`)

---

## 🚀 Deployment Guide

### 1. Create the Database Secret

The PostgreSQL StatefulSet reads credentials from a Kubernetes Secret. Apply it first:

```bash
kubectl apply -f database/secrets.yml
```

> ⚠️ **Do not commit real credentials.** The `secrets.yml` file stores base64-encoded values. Generate them with:
> ```bash
> echo -n "your_value" | base64
> ```

### 2. Deploy the Database

```bash
kubectl apply -f database/
```

Wait for the PostgreSQL pods to be `Running` before proceeding:

```bash
kubectl get pods -l app=postgres-db -w
```

### 3. Apply the Frontend ConfigMap

The frontend reads the backend API URL from a ConfigMap:

```bash
kubectl apply -f frontend/frontend-config.yml
```

### 4. Deploy All Services

Apply each service directory:

```bash
kubectl apply -f product-service/
kubectl apply -f cart-service/
kubectl apply -f inventory-service/
kubectl apply -f frontend/
```

Or deploy everything at once from the `k8s/` root:

```bash
kubectl apply -R -f .
```

---

## 🌐 Ingress & External Access

The frontend is exposed via an **NGINX Ingress** resource defined in `frontend/ingress.yml`.

```yaml
# frontend/ingress.yml (summary)
ingressClassName: nginx
rules:
  - http:
      paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: frontend-service
              port:
                number: 80
```

To get the external IP of your Ingress controller:

```bash
kubectl get ingress frontend-ingress
kubectl get svc -n ingress-nginx
```

> If you're using a custom domain, point your DNS A record to the **LoadBalancer** external IP.

---

## 📈 Horizontal Pod Autoscaling (HPA)

All backend services and the frontend are configured with HPAs using the `autoscaling/v2` API.

| Service        | Min Replicas | Max Replicas | CPU Target |
|----------------|:------------:|:------------:|:----------:|
| **Frontend**   | 2            | 10           | 50%        |
| **Product**    | configurable | configurable | configurable |
| **Cart**       | configurable | configurable | configurable |
| **Inventory**  | configurable | configurable | configurable |

HPAs require the **Metrics Server** to be running:

```bash
# For K3s (metrics-server is built-in)
kubectl top nodes

# For EKS, install metrics-server if not present:
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

Verify HPA status:

```bash
kubectl get hpa
```

---

## 🗄️ Database (PostgreSQL StatefulSet)

The database uses a **StatefulSet** (not a Deployment) to ensure stable network identity and persistent storage.

- **Replicas:** 2  
- **Storage:** `1Gi` via `PersistentVolumeClaim` with `storageClassName: gp2`  
- **Credentials:** Injected via Kubernetes Secrets (`postgres-secret`)  
- **Data Path:** `/var/lib/postgresql/data/pgdata`

---

## 🔍 Useful kubectl Commands

```bash
# View all resources in the default namespace
kubectl get all

# Check pod logs
kubectl logs -f deployment/frontend-deployment
kubectl logs -f deployment/cart-deployment
kubectl logs -f deployment/product-service

# Describe a pod for troubleshooting
kubectl describe pod <pod-name>

# Check HPA scaling activity
kubectl describe hpa

# Port-forward for local testing (bypass Ingress)
kubectl port-forward svc/frontend-service 8080:80
kubectl port-forward svc/product-service 8081:8081
kubectl port-forward svc/cart-service 8082:8082
kubectl port-forward svc/inventory-service 8083:8083

# Delete all resources (teardown)
kubectl delete -R -f .
```

---

## 🔐 Secrets Management

| Secret Name       | Used By           | Keys                                  |
|-------------------|-------------------|---------------------------------------|
| `postgres-secret` | PostgreSQL StatefulSet | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` |

> For production environments, consider using **AWS Secrets Manager**, **HashiCorp Vault**, or the **External Secrets Operator** instead of plain Kubernetes Secrets.

---

## 🏗️ Architecture Diagram

```
                          ┌─────────────────────────┐
                          │     NGINX Ingress        │
                          │  (LoadBalancer / NodePort)│
                          └───────────┬─────────────┘
                                      │  path: /
                          ┌───────────▼─────────────┐
                          │   Frontend Service       │
                          │  (Nginx, port 80)        │
                          │  HPA: 2–10 replicas      │
                          └───┬───────────┬──────────┘
                              │           │
               ┌──────────────▼──┐  ┌────▼──────────────┐
               │  Product Svc    │  │   Cart Svc         │
               │  port: 8081     │  │   port: 8082       │
               │  HPA enabled    │  │   3 replicas       │
               └──────┬──────────┘  └────────┬───────────┘
                      │                       │
         ┌────────────▼──────────────────────▼────────────┐
         │              Inventory Svc (port: 8083)         │
         │                    HPA enabled                  │
         └───────────────────────┬─────────────────────────┘
                                 │
                    ┌────────────▼───────────────┐
                    │   PostgreSQL StatefulSet    │
                    │   2 replicas, gp2 PVC 1Gi  │
                    │   Credentials via Secret    │
                    └────────────────────────────┘
```

---

## 📌 Related Directories

| Directory    | Description                              |
|--------------|------------------------------------------|
| `../app/`    | Application source code                  |
| `../helm/`   | Helm charts for templated deployments    |
| `../terraform/` | Infrastructure as Code (EKS, VPC, etc.) |
| `../.github/` | CI/CD GitHub Actions pipelines          |
