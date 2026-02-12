variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "s3_bucket_name" {
  description = "S3 bucket for weather data"
  type        = string
  default     = "static-sites-outdoor-activities-clothing-romania"
}

variable "lambda_function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "mountain-weather-forecast-generator"
}

variable "data_retention_days" {
  description = "Number of days to keep data accessible to frontend"
  type        = number
  default     = 7
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 900 # 15 minutes - weather API calls can take time
}

variable "lambda_memory" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 512
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default = {
    Project     = "mountain-weather"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
