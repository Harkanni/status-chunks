output "website_url" {

  value = aws_cloudfront_distribution.this.domain_name

}

output "distribution_id" {

  value = aws_cloudfront_distribution.this.id

}

output "bucket_name" {

  value = aws_s3_bucket.this.id

}