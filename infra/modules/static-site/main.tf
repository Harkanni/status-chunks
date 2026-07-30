resource "aws_s3_bucket" "this" {

  bucket = var.bucket_name

  force_destroy = true

}

resource "aws_s3_bucket_public_access_block" "this" {

  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true

}

resource "aws_cloudfront_origin_access_control" "this" {

  name = "${var.bucket_name}-oac"

  origin_access_control_origin_type = "s3"

  signing_behavior = "always"

  signing_protocol = "sigv4"

}

resource "aws_cloudfront_distribution" "this" {

  enabled = true

  default_root_object = "index.html"

  origin {

    domain_name = aws_s3_bucket.this.bucket_regional_domain_name

    origin_access_control_id = aws_cloudfront_origin_access_control.this.id

    origin_id = "S3Origin"

  }

  default_cache_behavior {
    target_origin_id = "S3Origin"
    allowed_methods = ["GET", "HEAD"]
    cached_methods = ["GET", "HEAD"]
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_router.arn
    }
  }

  restrictions {

    geo_restriction {

      restriction_type = "none"

    }

  }

  custom_error_response {

    error_code = 403

    response_code = 200

    response_page_path = "/index.html"

  }

  custom_error_response {

    error_code = 404

    response_code = 200

    response_page_path = "/index.html"

  }

  viewer_certificate {

    cloudfront_default_certificate = true

  }

}

resource "aws_cloudfront_function" "spa_router" {
  name    = "status-splitter-spa-router"
  runtime = "cloudfront-js-2.0"
  publish = true

  code = file("${path.module}/cloudfront-function.js")
}


data "aws_iam_policy_document" "bucket_policy" {

  statement {

    actions = ["s3:GetObject"]

    resources = [
      "${aws_s3_bucket.this.arn}/*"
    ]

    principals {

      type = "Service"

      identifiers = [
        "cloudfront.amazonaws.com"
      ]

    }

    condition {

      test = "StringEquals"

      variable = "AWS:SourceArn"

      values = [
        aws_cloudfront_distribution.this.arn
      ]

    }

  }

}

resource "aws_s3_bucket_policy" "this" {

  bucket = aws_s3_bucket.this.id

  policy = data.aws_iam_policy_document.bucket_policy.json

}
