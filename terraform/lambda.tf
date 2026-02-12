# Build Lambda deployment package
resource "null_resource" "lambda_build" {
  triggers = {
    # Rebuild when source files change
    source_hash = sha256(join("", [
      filesha256("${path.module}/../mountain_advice.py"),
      filesha256("${path.module}/../weather.py"),
      filesha256("${path.module}/../s3_uploader.py"),
      filesha256("${path.module}/../s3_config.py"),
      filesha256("${path.module}/../mountain_locations.json"),
      filesha256("${path.module}/../lambda_handler.py"),
      filesha256("${path.module}/../requirements-lambda.txt"),
    ]))
  }

  provisioner "local-exec" {
    command = <<-EOT
      cd ${path.module}/..
      rm -rf lambda_package lambda_package.zip
      mkdir -p lambda_package

      # Install dependencies
      pip install -r requirements-lambda.txt -t lambda_package/ --quiet

      # Copy source files
      cp mountain_advice.py lambda_package/
      cp weather.py lambda_package/
      cp s3_uploader.py lambda_package/
      cp s3_config.py lambda_package/
      cp mountain_locations.json lambda_package/
      cp lambda_handler.py lambda_package/

      # Create zip
      cd lambda_package
      zip -r ../lambda_package.zip . -x "*.pyc" -x "__pycache__/*" -x "*.dist-info/*"
    EOT
  }
}

# Data source for the Lambda zip file
data "archive_file" "lambda_dummy" {
  # This is a dummy to get Terraform to track the file
  # The actual zip is created by null_resource
  type        = "zip"
  source_dir  = "${path.module}/../lambda_package"
  output_path = "${path.module}/../lambda_package_dummy.zip"

  depends_on = [null_resource.lambda_build]
}

# Lambda function
resource "aws_lambda_function" "weather_forecast" {
  filename         = "${path.module}/../lambda_package.zip"
  function_name    = var.lambda_function_name
  role             = aws_iam_role.lambda_role.arn
  handler          = "lambda_handler.handler"
  runtime          = "python3.11"
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory
  source_code_hash = data.archive_file.lambda_dummy.output_base64sha256

  environment {
    variables = {
      S3_BUCKET_NAME      = var.s3_bucket_name
      DATA_RETENTION_DAYS = var.data_retention_days
      AWS_REGION_OVERRIDE = var.aws_region
    }
  }

  depends_on = [
    null_resource.lambda_build,
    aws_cloudwatch_log_group.lambda_log_group,
    aws_iam_role_policy.lambda_s3_policy,
    aws_iam_role_policy.lambda_logs_policy
  ]
}

# Lambda function URL (optional - for manual testing)
resource "aws_lambda_function_url" "weather_forecast_url" {
  function_name      = aws_lambda_function.weather_forecast.function_name
  authorization_type = "AWS_IAM" # Require IAM auth for security
}
