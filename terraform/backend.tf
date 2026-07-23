terraform {
  backend "s3" {
    bucket = "devsecops-state-s3"
    key = "env/project2/terraform.tfstate"
    region = "eu-north-1"
    use_lockfile = true
    encrypt = true
  }
}