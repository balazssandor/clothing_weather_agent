# Mountain Weather Forecast - Terraform Infrastructure

This Terraform configuration deploys the infrastructure for automated daily mountain weather forecast generation on AWS.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Cloud                                 │
│                                                                  │
│  ┌─────────────────┐     ┌─────────────────────────────────┐   │
│  │   EventBridge   │────▶│        Lambda Function          │   │
│  │  (Daily Cron)   │     │  - Generate forecasts (3 days)  │   │
│  │  5:00 AM UTC    │     │  - Upload to S3                 │   │
│  └─────────────────┘     │  - Archive old data (>7 days)   │   │
│                          └───────────────┬─────────────────┘   │
│                                          │                      │
│                                          ▼                      │
│                          ┌─────────────────────────────────┐   │
│                          │           S3 Bucket             │   │
│                          │  ┌─────────────────────────┐   │   │
│                          │  │ tomorrow_mountain_      │   │   │
│                          │  │ forecast_data/          │◀──┼───┼── Frontend reads
│                          │  │   date=2026-02-12/      │   │   │
│                          │  │   date=2026-02-13/      │   │   │
│                          │  │   date=2026-02-14/      │   │   │
│                          │  └─────────────────────────┘   │   │
│                          │  ┌─────────────────────────┐   │   │
│                          │  │ archive/                │   │   │   (not accessible
│                          │  │   tomorrow_mountain_    │   │   │    by frontend)
│                          │  │   forecast_data/        │   │   │
│                          │  │     date=2026-02-05/    │   │   │
│                          │  └─────────────────────────┘   │   │
│                          └─────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────┐                                            │
│  │ CloudWatch Logs │◀── Lambda execution logs                   │
│  └─────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Resources Created

- **Lambda Function**: Generates weather forecasts and archives old data
- **IAM Role & Policies**: Permissions for Lambda to access S3 and CloudWatch
- **EventBridge Rule**: Triggers Lambda daily at 5:00 AM UTC
- **CloudWatch Log Group**: Stores Lambda execution logs (30-day retention)

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.0
3. Python 3.11 (for local testing)

## Deployment

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Configure Variables (Optional)

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars as needed
```

### 3. Review the Plan

```bash
terraform plan
```

### 4. Apply

```bash
terraform apply
```

## Configuration Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `aws_region` | `us-east-1` | AWS region |
| `s3_bucket_name` | `static-sites-outdoor-activities-clothing-romania` | S3 bucket for data |
| `lambda_function_name` | `mountain-weather-forecast-generator` | Lambda function name |
| `schedule_expression` | `cron(0 5 * * ? *)` | Daily schedule (5 AM UTC) |
| `data_retention_days` | `7` | Days to keep data accessible |
| `lambda_timeout` | `900` | Lambda timeout in seconds |
| `lambda_memory` | `512` | Lambda memory in MB |

## Data Flow

### Forecast Generation
1. Lambda runs daily at 5:00 AM UTC
2. Generates forecasts for tomorrow, day+2, and day+3
3. Uploads to `s3://bucket/tomorrow_mountain_forecast_data/date=YYYY-MM-DD/`

### Data Archival
1. After generating forecasts, Lambda checks for old data
2. Data older than `data_retention_days` (default: 7) is moved to `archive/` prefix
3. Archived data is preserved but not accessible to the frontend

### File Structure in S3
```
tomorrow_mountain_forecast_data/
├── date=2026-02-12/
│   ├── forecast_metadata.json
│   ├── muntii_fagaras_balea_lac_hourly_data_full_day.json
│   ├── muntii_fagaras_balea_lac_weather_data_24h.json
│   └── ...
├── date=2026-02-13/
│   └── ...
└── date=2026-02-14/
    └── ...

archive/
└── tomorrow_mountain_forecast_data/
    ├── date=2026-02-05/
    │   └── ... (archived data)
    └── date=2026-02-04/
        └── ...
```

## Manual Invocation

To manually trigger the Lambda:

```bash
aws lambda invoke \
  --function-name mountain-weather-forecast-generator \
  --payload '{"source": "manual"}' \
  --cli-binary-format raw-in-base64-out \
  response.json

cat response.json
```

## Local Testing

Test the Lambda handler locally:

```bash
cd /path/to/clothing_weather_agent
export S3_BUCKET_NAME=static-sites-outdoor-activities-clothing-romania
export DATA_RETENTION_DAYS=7
python lambda_handler.py
```

## Monitoring

View Lambda logs:

```bash
aws logs tail /aws/lambda/mountain-weather-forecast-generator --follow
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: This will not delete the S3 bucket contents. Data in the bucket will remain.
