variable "aws_region" {
  type = string
  default = "eu-north-1"
}

variable "ecr-name" {
  type = list(string)
  default = ["frontend", 
            "cart-service", 
            "product-service", 
            "inventory-service"]
}

variable "environment" {
  type = string
  default = "dev"
}

variable "key_name" {
  type = string
  default = "devsecops-key"
}