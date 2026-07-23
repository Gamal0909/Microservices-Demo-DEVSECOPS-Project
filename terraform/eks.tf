module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  version         = "~> 20.0"
  
  cluster_name    = "microservices-project-eks"
  cluster_version = "1.28"
  
  vpc_id          = module.vpc.vpc_id
  control_plane_subnet_ids = module.vpc.private_subnets
  endpoint_public_access  = true
  endpoint_private_access = true
  
  eks_managed_node_groups = {
    eks_nodes = {
      desired_size = 2
      max_size     = 4
      min_size     = 2

      instance_types = ["t3.small"]

      key_name = var.key_name

      tags = {
        Name = "eks-node-group"
      }
    }
  }
  
  cluster_addons = {
    kube-proxy = {
      most_recent = true
    }
    coredns = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
  }

  tags = {
    Terraform   = "true"
    Environment = var.environment
  }
}