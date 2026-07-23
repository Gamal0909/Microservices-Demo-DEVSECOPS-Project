output "eks-cluster-endpoint" {
  value = module.eks.cluster_endpoint
}

output "eks-cluster-ca-cert" {
  value = module.eks.cluster_certificate_authority_data
}

output "ecr-repositories" {
  value = { for repo in aws_ecr_repository.ecr-repo : repo.name => repo.repository_url }
}