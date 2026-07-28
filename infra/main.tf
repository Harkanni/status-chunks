module "website" {
  source = "./modules/static-site"
  
  bucket_name = var.bucket_name
}

module "oidc" {
  source = "./modules/oidc-manager"

  repositories = var.github_repositories

  role_name = "GitHubActionsWorkflowRole"
}
