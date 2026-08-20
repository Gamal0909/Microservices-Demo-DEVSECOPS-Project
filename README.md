# 🛒 E-Commerce Microservices — DevSecOps Project

A production-grade, cloud-native e-commerce platform built with a polyglot microservices architecture. The project demonstrates a complete **DevSecOps** pipeline — from local Docker Compose development through automated security scanning to a Kubernetes deployment on **AWS EKS** (provisioned with Terraform) or a lightweight **K3s** cluster.

---

## 📑 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Microservices](#-microservices)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Local Development](#-local-development)
- [Kubernetes Deployment](#-kubernetes-deployment)
- [Helm Charts](#-helm-charts)
- [Infrastructure (Terraform)](#-infrastructure-terraform)
- [Security](#-security)
- [GitHub Secrets](#-github-secrets)
- [Branch Strategy](#-branch-strategy)

---

## 🏗️ Architecture Overview

```
                        ┌──────────────────────────┐
                        │   NGINX Ingress Controller │
                        │   (AWS ELB / NodePort)     │
                        └────────────┬───────────────┘
                                     │  path: /
                        ┌────────────▼───────────────┐
                        │      Frontend Service       │
                        │  React + Nginx  (port 80)   │
                        │     HPA: 2–10 replicas      │
                        └───┬──────────┬──────────────┘
                            │          │
             ┌──────────────▼──┐  ┌───▼──────────────┐
             │  Product Service │  │   Cart Service    │
             │  Java/Spring Boot│  │   Node.js/Express │
             │  port: 8081      │  │   port: 8082      │
             │  HPA enabled     │  │   3 replicas      │
             └──────┬───────────┘  └──────┬────────────┘
                    │                     │
       ┌────────────▼─────────────────────▼────────────┐
       │           Inventory Service (Go)               │
       │               port: 8083, HPA enabled          │
       └────────────────────────┬───────────────────────┘
                                │
               ┌────────────────▼─────────────────┐
               │     PostgreSQL StatefulSet         │
               │  2 replicas · gp2 PVC 1Gi         │
               │  Credentials via K8s Secret        │
               └──────────────────────────────────-─┘
```

The **frontend (Nginx)** serves the React SPA and reverse-proxies API calls to the backend services by path prefix:

| Path prefix   | Upstream service       |
|---------------|------------------------|
| `/products/`  | `product-service:8081` |
| `/cart/`      | `cart-service:8082`    |
| `/inventory/` | `inventory-service:8083` |

---

## 🧰 Tech Stack

| Layer              | Technology                                    |
|--------------------|-----------------------------------------------|
| **Frontend**       | React 18, Vite, Nginx                         |
| **Cart Service**   | Node.js 20, Express 4, prom-client            |
| **Product Service**| Java 17, Spring Boot, Maven, Prometheus       |
| **Inventory Service** | Go 1.22, net/http, Prometheus client       |
| **Database**       | PostgreSQL (StatefulSet)                      |
| **Containerisation** | Docker, Docker Compose, GHCR               |
| **Orchestration**  | Kubernetes (K3s / AWS EKS)                    |
| **Packaging**      | Helm 3                                        |
| **IaC**            | Terraform (AWS EKS + VPC)                     |
| **CI/CD**          | GitHub Actions                                |
| **SAST**           | SonarQube                                     |
| **Container Scan** | Trivy (Aqua Security)                         |

---

## 📁 Repository Structure

```
.
├── app/
│   ├── frontend/                  # React SPA + Nginx reverse proxy
│   ├── cart-service-node/         # Cart API (Node.js / Express)
│   ├── product-service-java/      # Product catalog (Spring Boot)
│   └── inventory-service-go/      # Inventory API (Go)
│
├── k8s/
│   ├── frontend/                  # Deployment, Service, Ingress, HPA, ConfigMap
│   ├── cart-service/              # Deployment, Service, HPA
│   ├── product-service/           # Deployment, Service, HPA
│   ├── inventory-service/         # Deployment, Service, HPA
│   └── database/                  # PostgreSQL StatefulSet, Service, Secret
│
├── helm/
│   ├── frontend/                  # Helm chart for frontend
│   ├── cart-service/              # Helm chart for cart service
│   ├── product-service/           # Helm chart for product service
│   ├── inventory-service/         # Helm chart for inventory service
│   └── database/                  # Helm chart for PostgreSQL
│
├── terraform/                     # AWS EKS + VPC infrastructure
├── .github/workflows/main.yml     # GitHub Actions CI/CD pipeline
├── docker-compose.yml             # Local development stack
└── env.env                        # Environment variable reference
```

---

## 🔬 Microservices

### 🖥️ Frontend (`app/frontend`)

- **Framework:** React 18 + Vite
- **Serving:** Multi-stage Docker build → Nginx serving static assets
- **Port:** `80` (container), `8080` (Docker Compose)
- **Routing:** Nginx reverse-proxies `/products/`, `/cart/`, `/inventory/` to backend services

### 🛒 Cart Service (`app/cart-service-node`)

- **Runtime:** Node.js ≥ 20, Express 4
- **Port:** `8082`
- **Endpoints:**
  - `GET /health` — health check
  - `GET /api/cart` — retrieve cart items
  - `POST /api/cart` — add item to cart
  - `DELETE /api/cart/:id` — remove item from cart
  - `GET /metrics` — Prometheus metrics

### 📦 Product Service (`app/product-service-java`)

- **Runtime:** Java 17, Spring Boot
- **Port:** `8081`
- **Endpoints:**
  - `GET /api/products` — list all products
  - `GET /api/products/{id}` — product detail
  - `GET /api/categories` — product categories
  - `GET /actuator/health` — Spring health check
  - `GET /actuator/prometheus` — Prometheus metrics
- **Database:** PostgreSQL (via Spring Data JPA)

### 📊 Inventory Service (`app/inventory-service-go`)

- **Runtime:** Go 1.22, `net/http`
- **Port:** `8083`
- **Endpoints:**
  - `GET /health` — health check
  - `GET /api/inventory/{productId}` — inventory by product
  - `GET /metrics` — Prometheus metrics (histogram + counter)

### 🗄️ Database

- **Image:** `postgres:latest`
- **Kubernetes:** StatefulSet with 2 replicas and a `1Gi` PersistentVolumeClaim (`gp2` StorageClass for EKS)
- **Credentials:** Stored in a Kubernetes Secret (`postgres-secret`)

---

## ⚙️ CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/main.yml`) implements a fully automated **build → scan → push** pipeline.

```
Push to branch
      │
      ▼
┌─────────────────────┐
│  detect-changes      │  (dorny/paths-filter)
│  Per-service matrix  │
└──┬──────────────────┘
   │
   ├──► scan-frontend-and-cart-node  (SonarQube)
   ├──► scan-product-java            (Maven + SonarQube)
   └──► scan-inventory-go            (go test + SonarQube)
                │
                ▼
   ┌────────────────────────────┐
   │  build-and-scan-containers  │  (parallel matrix)
   │  ┌─────────────────────┐   │
   │  │  Docker Buildx       │   │
   │  │  Trivy image scan    │   │
   │  │  Push → GHCR         │   │
   │  └─────────────────────┘   │
   └────────────────────────────┘
```

### Pipeline Stages

| Stage | Description |
|-------|-------------|
| **detect-changes** | Uses `dorny/paths-filter` to determine which services changed — only affected services are scanned/built |
| **scan-frontend-and-cart-node** | SonarQube static analysis for React frontend and Node.js cart service |
| **scan-product-java** | Maven `clean verify` + SonarQube scan via Maven plugin |
| **scan-inventory-go** | `go test -short -coverprofile` + SonarQube scan |
| **build-and-scan-containers** | Docker Buildx (with GHA layer cache) → Trivy `CRITICAL/HIGH` image scan → push to `ghcr.io` |

Scan reports (SonarQube task files, Trivy JSON reports) are uploaded as **GitHub Actions artifacts** after each stage.

---

## 💻 Local Development

### Prerequisites

- Docker & Docker Compose v2
- `git`

### Run the full stack locally

```bash
git clone https://github.com/Gamal0909/Microservices-Demo-DEVSECOPS-Project.git
cd k3s-microservices-ecommerce

docker compose up --build
```

| Service           | URL                          |
|-------------------|------------------------------|
| Frontend          | http://localhost:8080        |
| Product Service   | http://localhost:8081        |
| Cart Service      | http://localhost:8082        |
| Inventory Service | http://localhost:8083        |
| PostgreSQL        | `localhost:5432`             |

### Network Design

Docker Compose uses two isolated networks:

- `my-private-network` (`internal: true`) — backend services + database
- `my-public-network` (`internal: false`) — frontend only (internet-facing)

The frontend container joins **both** networks, acting as the sole ingress point.

### Run a single service locally

**Cart Service (Node.js):**
```bash
cd app/cart-service-node
npm install
npm run dev
```

**Product Service (Java):**
```bash
cd app/product-service-java
mvn spring-boot:run
```

**Inventory Service (Go):**
```bash
cd app/inventory-service-go
go run main.go
```

**Frontend (React/Vite):**
```bash
cd app/frontend
npm install
npm run dev
```

---

## ☸️ Kubernetes Deployment

> See [`k8s/README.md`](k8s/README.md) for the full Kubernetes guide.

### Quick Deploy (apply all manifests)

```bash
# 1. Apply database secret first
kubectl apply -f k8s/database/secrets.yml

# 2. Deploy all services
kubectl apply -R -f k8s/
```

### Deploy services individually

```bash
kubectl apply -f k8s/database/
kubectl apply -f k8s/product-service/
kubectl apply -f k8s/cart-service/
kubectl apply -f k8s/inventory-service/
kubectl apply -f k8s/frontend/
```

### Verify deployment

```bash
kubectl get pods
kubectl get svc
kubectl get ingress
kubectl get hpa
```

### Port-forward for local testing

```bash
kubectl port-forward svc/frontend-service 8080:80
kubectl port-forward svc/product-service 8081:8081
kubectl port-forward svc/cart-service 8082:8082
kubectl port-forward svc/inventory-service 8083:8083
```

### Horizontal Pod Autoscaling

All services include HPA resources using `autoscaling/v2`:

| Service        | Min | Max | CPU Target |
|----------------|:---:|:---:|:----------:|
| Frontend       | 2   | 10  | 50%        |
| Product Svc    | configurable | configurable | configurable |
| Cart Svc       | configurable | configurable | configurable |
| Inventory Svc  | configurable | configurable | configurable |

> **Requires** the Kubernetes Metrics Server. On EKS:
> ```bash
> kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
> ```

### Secrets Management

```bash
# Generate base64-encoded values
echo -n "your_password" | base64

# Apply the secret
kubectl apply -f k8s/database/secrets.yml
```

> ⚠️ For production, consider **AWS Secrets Manager**, **HashiCorp Vault**, or the **External Secrets Operator**.

### Container Images (GHCR)

| Service           | Image                                          |
|-------------------|------------------------------------------------|
| Frontend          | `ghcr.io/gamal0909/frontend-service:latest`    |
| Product Service   | `ghcr.io/gamal0909/product-service:latest`     |
| Cart Service      | `ghcr.io/gamal0909/cart-service:latest`        |
| Inventory Service | `ghcr.io/gamal0909/inventory-service:latest`   |

---

## ⛵ Helm Charts

Each service has a Helm chart in the `helm/` directory for templated, parameterized deployments.

```bash
# Install a service with Helm
helm install frontend ./helm/frontend
helm install cart-service ./helm/cart-service
helm install product-service ./helm/product-service
helm install inventory-service ./helm/inventory-service
helm install database ./helm/database

# Upgrade with custom values
helm upgrade frontend ./helm/frontend --set replicaCount=5

# Uninstall
helm uninstall frontend
```

---

## 🏗️ Infrastructure (Terraform)

The `terraform/` directory provisions the AWS infrastructure required to run the cluster.

### Resources Provisioned

- **VPC** with public/private subnets across multiple AZs
- **AWS EKS Cluster** with managed node groups
- **ECR Repositories** for container images
- **IAM Roles** (EKS cluster role, node role, EBS CSI driver)
- **EBS CSI Driver** add-on for persistent volume support (`gp2` StorageClass)

### Usage

```bash
cd terraform

# Initialise providers and backend
terraform init

# Preview changes
terraform plan

# Apply infrastructure
terraform apply

# Configure kubectl for the new cluster
aws eks update-kubeconfig --region <region> --name <cluster-name>

# Tear down all resources
terraform destroy
```

> ⚠️ **Cost Warning:** Running an EKS cluster incurs AWS charges. Always destroy the infrastructure when not in use.

---

## 🔐 Security

### Static Application Security Testing (SAST)

[SonarQube](https://www.sonarqube.org/) scans are triggered automatically on every push for changed services:

- **Frontend & Cart:** `SonarSource/sonarqube-scan-action@v3`
- **Product (Java):** `mvn org.sonarsource.scanner.maven:sonar-maven-plugin:sonar`
- **Inventory (Go):** `SonarSource/sonarqube-scan-action@v3` with coverage report

### Container Image Scanning

[Trivy](https://aquasecurity.github.io/trivy/) scans every built Docker image for `CRITICAL` and `HIGH` CVEs before pushing to GHCR:

```yaml
- uses: aquasecurity/trivy-action@master
  with:
    severity: "CRITICAL,HIGH"
    ignore-unfixed: true
    format: "json"
```

Trivy JSON reports are uploaded as GitHub Actions artifacts for audit purposes.

---

## 🔑 GitHub Secrets

Configure the following secrets in your GitHub repository settings (`Settings → Secrets and variables → Actions`):

| Secret            | Description                                      |
|-------------------|--------------------------------------------------|
| `SONAR_HOST_URL`  | URL of your SonarQube server (e.g. `https://sonar.example.com`) |
| `SONAR_TOKEN`     | SonarQube user token with analysis permissions   |
| `GITHUB_TOKEN`    | Auto-provided by GitHub Actions — used to push to GHCR |

---

## 🌿 Branch Strategy

| Branch              | Purpose                                             |
|---------------------|-----------------------------------------------------|
| `main`              | Stable, production-ready code                       |
| `kubernetes-files`  | Active development — Kubernetes manifests & CI/CD   |
| `containerized-App` | Docker Compose / container-focused development      |

CI/CD pipeline triggers on pushes to `kubernetes-files` and `containerized-App`, and on pull requests targeting `main`.

---

## 📜 License

This project is open source and available for educational and demonstration purposes.