variable "aws_region" {
  default     = "us-east-1"
  description = "AWS region to deploy bucket in"
  type        = string
}

variable "bucket_name" {
  type        = string
  description = "Name of the S3 bucket to create for the static site"
  default     = "whatsapp-status-chunker-bucket"
}

variable "github_repositories" {
  type = list(string)

  description = "Repositories allowed to assume the GitHub OIDC role"

#   example = [
#     "Harkanni/frontend",
#     "Harkanni/infrastructure"
#   ]
}
