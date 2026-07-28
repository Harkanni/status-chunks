resource "aws_iam_openid_connect_provider" "github" {

  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1"
  ]

}

locals {

  repository_subjects = [
    for repo in var.repositories :
    "repo:${repo}:*"
  ]

}

data "aws_iam_policy_document" "assume_role" {

  statement {

    effect = "Allow"

    actions = [
      "sts:AssumeRoleWithWebIdentity"
    ]

    principals {

      type = "Federated"

      identifiers = [
        aws_iam_openid_connect_provider.github.arn
      ]

    }

    condition {

      test = "StringEquals"

      variable = "token.actions.githubusercontent.com:aud"

      values = [
        "sts.amazonaws.com"
      ]

    }

    condition {

      test = "StringLike"

      variable = "token.actions.githubusercontent.com:sub"

      values = local.repository_subjects

    }

  }

}

resource "aws_iam_role" "github" {

  name = var.role_name

  assume_role_policy = data.aws_iam_policy_document.assume_role.json

}

resource "aws_iam_role_policy_attachment" "s3" {

  role = aws_iam_role.github.name

  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"

}


resource "aws_iam_role_policy_attachment" "cloudfront" {

  role = aws_iam_role.github.name

  policy_arn = "arn:aws:iam::aws:policy/CloudFrontFullAccess"

}