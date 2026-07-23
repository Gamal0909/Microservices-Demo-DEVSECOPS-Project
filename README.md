# K3S Microservices E-Commerce Infrastructure

A comprehensive Infrastructure as Code (IaC) setup for deploying a microservices-based e-commerce platform on AWS using Terraform. This infrastructure includes a VPC, EKS cluster, ECR registries, and all necessary networking components with security best practices.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Configuration Variables](#configuration-variables)
- [Deployment Guide](#deployment-guide)
- [Infrastructure Components](#infrastructure-components)
- [Security Features](#security-features)
- [Cost Optimization](#cost-optimization)
- [Cleanup](#cleanup)

## 🏗️ Overview

This project sets up a production-ready microservices infrastructure on AWS with:
- **VPC**: Custom Virtual Private Cloud with public and private subnets across 3 availability zones
- **EKS**: Elastic Kubernetes Service cluster (v1.28) for container orchestration
- **ECR**: Elastic Container Registry repositories for Docker images
- **State Management**: S3-backed Terraform state with encryption and locking

The infrastructure supports the following microservices:
- Frontend application
- Cart Service
- Product Service
- Inventory Service

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        AWS Account                        │
├─────────────────────────────────────────────────────────┤
│                   VPC (10.0.0.0/16)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Public Subnets (3 AZs)                          │   │
│  │  - 10.0.4.0/24, 10.0.5.0/24, 10.0.6.0/24        │   │
│  │  - NAT Gateway for egress                        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Private Subnets (3 AZs)                         │   │
│  │  - 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24        │   │
│  │  - EKS Node Groups                               │   │
│  │  - 2-4 t3.small instances                        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  EKS Cluster (v1.28)                             │   │
│  │  - Control Plane (AWS managed)                   │   │
│  │  - Add-ons: CoreDNS, kube-proxy, VPC-CNI         │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ECR Repositories (KMS encrypted)                │   │
│  │  - frontend                                      │   │
│  │  - cart-service                                  │   │
│  │  - product-service                              │   │
│  │  - inventory-service                            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 📦 Prerequisites

- **Terraform** >= 1.0
- **AWS Account** with appropriate IAM permissions
- **AWS CLI** configured with credentials
- **kubectl** (for interacting with the cluster after deployment)
- **S3 bucket** for Terraform state (create before deployment)
- **AWS KMS key** for state encryption (optional but recommended)

### Required IAM Permissions

Your AWS user/role must have permissions for:
- VPC management (EC2, NAT Gateway)
- EKS cluster and node group operations
- ECR repository management
- IAM role and policy management
- S3 bucket access for state

## 📁 Project Structure

```
.
├── README.md                 # This file
├── terraform/
│   ├── backend.tf           # S3 backend configuration
│   ├── provider.tf          # AWS provider configuration
│   ├── vpc.tf               # VPC and networking
│   ├── eks.tf               # EKS cluster and node groups
│   ├── ecr.tf               # ECR repositories
│   └── variables.tf         # Input variables
```

## ⚙️ Configuration Variables

The infrastructure can be customized via `terraform/variables.tf`:

| Variable | Default | Description |
|----------|---------|-------------|
| `aws_region` | `eu-north-1` | AWS region for deployment |
| `environment` | `dev` | Environment name (dev/staging/prod) |
| `key_name` | `devsecops-key` | EC2 key pair name for SSH access to nodes |
| `ecr-name` | `[frontend, cart-service, product-service, inventory-service]` | List of ECR repository names |

### Override Variables

Create a `terraform.tfvars` file:

```hcl
aws_region = "us-east-1"
environment = "prod"
key_name = "my-production-key"
ecr-name = ["frontend", "backend", "database", "cache"]
```

## 🚀 Deployment Guide

### Step 1: Prepare S3 Backend

```bash
# Create S3 bucket for state (if not exists)
aws s3 mb s3://devsecops-state-s3 --region eu-north-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket devsecops-state-s3 \
  --versioning-configuration Status=Enabled \
  --region eu-north-1

# Block public access
aws s3api put-public-access-block \
  --bucket devsecops-state-s3 \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### Step 2: Initialize Terraform

```bash
cd terraform/
terraform init
```

### Step 3: Plan Deployment

```bash
terraform plan -out=tfplan
```

Review the planned changes before proceeding.

### Step 4: Apply Configuration

```bash
terraform apply tfplan
```

This will create:
- VPC with 6 subnets across 3 AZs
- EKS cluster with managed node groups
- 4 ECR repositories
- NAT Gateway for private subnet egress
- All necessary IAM roles and policies

### Step 5: Configure kubectl Access

```bash
aws eks update-kubeconfig \
  --region eu-north-1 \
  --name microservices-project-eks
```

Verify cluster access:

```bash
kubectl get nodes
```

## 🔧 Infrastructure Components

### VPC (vpc.tf)

- **CIDR Block**: 10.0.0.0/16
- **Availability Zones**: 3 (a, b, c in configured region)
- **Subnets**:
  - Public: 10.0.4.0/24, 10.0.5.0/24, 10.0.6.0/24
  - Private: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
- **NAT Gateway**: Enabled for private subnet egress
- **DNS**: Enabled for cluster requirements

### EKS Cluster (eks.tf)

- **Cluster Version**: 1.28
- **Cluster Name**: microservices-project-eks
- **Node Groups**: 1 managed node group
  - **Desired Size**: 2 nodes
  - **Min Size**: 2 nodes
  - **Max Size**: 4 nodes
  - **Instance Type**: t3.small
- **Add-ons**:
  - CoreDNS (for service discovery)
  - kube-proxy (for network proxy)
  - VPC-CNI (for pod networking)
- **Endpoint Access**: Public and Private enabled

### ECR Repositories (ecr.tf)

Four secure repositories with:
- **Encryption**: KMS encryption enabled
- **Image Scanning**: Automatic scan on push
- **Repositories**:
  1. frontend
  2. cart-service
  3. product-service
  4. inventory-service

## 🔒 Security Features

- **Network Isolation**: Private subnets for EKS nodes with NAT gateway for egress
- **Encryption**:
  - ECR repositories encrypted with KMS
  - Terraform state encrypted in S3
- **Image Scanning**: Automatic vulnerability scanning on ECR push
- **IAM**: Least privilege roles and policies for all resources
- **Private Endpoints**: EKS control plane accessible via private endpoint
- **Tags**: All resources tagged for cost allocation and compliance

## 💰 Cost Optimization

- **Instance Type**: t3.small for development/testing (upgrade to t3.medium or larger for production)
- **Auto-scaling**: Node group scales from 2 to 4 nodes based on demand
- **VPC**: Single VPC for cost efficiency
- **NAT Gateway**: Consider NAT instances for lower-traffic environments

### Estimated Monthly Cost (us-east-1)

- EKS Cluster: ~$73 (fixed)
- 2-4 t3.small nodes: ~$30-60
- NAT Gateway: ~$32 (plus data processing)
- ECR Storage: Minimal for small images
- **Total**: ~$135-165/month (estimate only)

## 📊 Monitoring & Logging

After deployment, configure:

```bash
# CloudWatch logs for EKS
kubectl logs -n kube-system -l k8s-app=kube-proxy

# Check node status
kubectl get nodes -o wide

# Monitor pods
kubectl get pods -A

# View cluster events
kubectl get events -A
```

## 🧹 Cleanup

To destroy all infrastructure:

```bash
cd terraform/
terraform destroy
```

⚠️ **Warning**: This will delete all resources including the EKS cluster and ECR repositories. Ensure no production workloads are running.

## 🐛 Troubleshooting

### State Lock Issues

If Terraform is stuck on a lock:

```bash
terraform force-unlock <LOCK_ID>
```

### Cannot Connect to Cluster

```bash
# Verify cluster exists
aws eks describe-cluster --name microservices-project-eks --region eu-north-1

# Update kubeconfig
aws eks update-kubeconfig --region eu-north-1 --name microservices-project-eks

# Check security groups and IAM permissions
```

### ECR Login Issues

```bash
# Get login token (valid for 12 hours)
aws ecr get-login-password --region eu-north-1 | \
  docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.eu-north-1.amazonaws.com
```

## 📝 Notes

- The infrastructure uses the latest EKS AMI automatically managed by AWS
- Node group uses on-demand instances (consider spot instances for cost savings)
- All resources are tagged with `Environment` and `Terraform=true` for easy identification
- Terraform state is locked with DynamoDB for concurrent access safety

## 📚 References

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [EKS Terraform Module](https://registry.terraform.io/modules/terraform-aws-modules/eks/aws/latest)
- [VPC Terraform Module](https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest)
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)

## 📄 License

This infrastructure code is provided as-is for educational and development purposes.