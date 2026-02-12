output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.weather_forecast.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.weather_forecast.arn
}

output "lambda_function_url" {
  description = "URL to invoke Lambda (requires IAM auth)"
  value       = aws_lambda_function_url.weather_forecast_url.function_url
}

output "eventbridge_rules" {
  description = "ARNs of the EventBridge rules"
  value = {
    for k, v in aws_cloudwatch_event_rule.forecast_schedule : k => {
      arn  = v.arn
      cron = v.schedule_expression
    }
  }
}

output "cloudwatch_log_group" {
  description = "CloudWatch Log Group for Lambda"
  value       = aws_cloudwatch_log_group.lambda_log_group.name
}

output "schedules" {
  description = "Scheduled run times (UTC)"
  value = {
    morning   = "05:00 UTC (7am winter / 8am summer Romania)"
    afternoon = "12:00 UTC (2pm winter / 3pm summer Romania)"
    evening   = "18:00 UTC (8pm winter / 9pm summer Romania)"
  }
}

output "s3_bucket" {
  description = "S3 bucket for weather data"
  value       = var.s3_bucket_name
}

output "data_retention_days" {
  description = "Days to keep data accessible to frontend"
  value       = var.data_retention_days
}
