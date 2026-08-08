module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  version         = "~> 20.0"
  
  cluster_name    = "microservices-project-eks"
  cluster_version = "1.32"
  
  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.private_subnets
  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true
  


  eks_managed_node_groups = {
    eks_nodes = {
      desired_size = 5
      max_size     = 10
      min_size     = 5

      instance_types = ["t3.small"]

      tags = {
        Name = "eks-node-group"
      }
    }
  }
  
  cluster_addons = {
    aws-ebs-csi-driver = {
      most_recent              = true
      service_account_role_arn = aws_iam_role.ebs_csi.arn
    }
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
