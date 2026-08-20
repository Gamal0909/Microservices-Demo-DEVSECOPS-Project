resource "aws_ecr_repository" "ecr-repo" {
  for_each = toset(var.ecr-name)
  name     = each.value

  encryption_configuration {
    encryption_type = "KMS"
  }
  image_scanning_configuration {
    scan_on_push = true
  }
  tags = {
    Name        = each.value
    Environment = var.environment
  }

}
