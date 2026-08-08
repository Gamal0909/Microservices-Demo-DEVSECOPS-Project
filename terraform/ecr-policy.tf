# IAM policy attachment: allow EKS worker nodes to pull images from ECR
resource "aws_iam_role_policy_attachment" "ecr_read_only" {
  role       = module.eks.eks_managed_node_groups["eks_nodes"].iam_role_name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}
