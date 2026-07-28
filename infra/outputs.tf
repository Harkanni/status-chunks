output "website_url" {
  value = module.website.website_url
}

output "distribution_id" {
  value = module.website.distribution_id
}

output "github_role_arn" {
  value = module.oidc.role_arn
}

output "bucket_name" {
  value = module.website.bucket_name
}