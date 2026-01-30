# Deployment Guide

Complete guide for deploying the ski touring weather forecast website to S3.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  mountain_advice.py                                 │
│  - Fetches weather data from Open-Meteo API        │
│  - Generates clothing recommendations with AI       │
│  - Creates weather data for dynamic JS charts               │
│  - Saves locally + uploads to S3                   │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│  S3 Bucket: static-sites-outdoor-activities...     │
│  ├── index.html (you upload manually)              │
│  ├── muntii_fagaras_above_1800m_weather_plot.png  │
│  ├── muntii_fagaras_above_1800m_model_advice.md   │
│  ├── muntii_apuseni_above_1800m_weather_plot.png  │
│  └── ... (all location files at bucket root)       │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│  Public Website                                     │
│  https://static-sites-outdoor-activities...        │
│  /index.html                                        │
└─────────────────────────────────────────────────────┘
```

## Deployment Workflow

### 1. Generate Forecast Data

```bash
python mountain_advice.py
```

This will:
- Fetch tomorrow's weather for all mountain locations
- Generate AI clothing recommendations
- Create weather charts
- Save everything locally
- **Automatically upload to S3 bucket root**

### 2. Upload Website (First Time / Updates)

```bash
./upload_website.sh
```

This uploads `web/index.html` to the S3 bucket root.

### Management of site is from the static pages repository which manages Cloudfront, WAF etc.

## The further AI generated content needs a review 

### 3. Access Your Site

```
https://static-sites-outdoor-activities-clothing-romania.s3.us-east-1.amazonaws.com/index.html
```

## File Structure

### Local Files
```
clothing_weather_agent/
├── mountain_advice.py              # Main generator script
├── s3_uploader.py                  # S3 upload logic
├── s3_config.py                    # S3 configuration
├── upload_website.sh               # Helper script to upload index.html
├── web/
│   └── index.html                  # Website (upload to S3)
└── tomorrow_mountain_forecast_data/
    └── date=2026-01-28/
        ├── *_weather_data_24h.json
        ├── *_model_advice.md
        ├── *_weather_plot_7am_10pm.png
        └── ... (all generated files)
```

### S3 Bucket (Flat Structure)
```
s3://static-sites-outdoor-activities-clothing-romania/
├── index.html                                         ← You upload
├── forecast_metadata.json                             ← Script uploads (contains date!)
├── muntii_fagaras_above_1800m_weather_data_24h.json  ← Script uploads
├── muntii_fagaras_above_1800m_model_advice.md        ← Script uploads
├── muntii_fagaras_above_1800m_weather_plot_7am_10pm.png
├── muntii_apuseni_above_1800m_weather_data_24h.json
└── ... (all files at root, no subfolders)
```

**Important:** `forecast_metadata.json` contains the forecast date:
```json
{
  "forecast_date": "2026-01-28",
  "generated_at": "2026-01-27",
  "locations_count": 10,
  "time_window": "7am-10pm"
}
```

The website reads this file to display the correct forecast date.

## How index.html Works

The website uses **relative paths** to load data and **metadata** to know the forecast date:

```javascript
// In index.html
// 1. Load metadata to get the forecast date
const metadata = await fetch('./forecast_metadata.json');
const forecastDate = metadata.forecast_date; // e.g., "2026-01-28"

// 2. Load data files using relative paths
const plotUrl = './muntii_fagaras_above_1800m_weather_plot_7am_10pm.png';
const adviceUrl = './muntii_fagaras_above_1800m_model_advice.md';
```

Since both index.html and data files are at the bucket root, relative paths work perfectly. The metadata file tells the website exactly what date the forecast is for.

## Automation

### Option 1: Manual Daily Updates

Run once per day:
```bash
python mountain_advice.py
# Data automatically uploaded to S3
# Website automatically updated
```

### Option 2: Cron Job (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add this line to run daily at 9 AM
0 9 * * * cd /Users/bsandor/dev2/agent-course-linkedin/clothing_weather_agent/ && source ../venv/bin/activate && python3 mountain_advice.py && python3 s3_uploader.py


```

### Option 3: AWS Lambda (Future)

Could be set up to run automatically in AWS Lambda on a schedule.

## Costs

**Estimated monthly cost:** < $0.50

- Storage: ~10 MB (all location files)
- Requests: Minimal (updated once daily, viewed occasionally)
- Data transfer: Negligible

## Troubleshooting

### Files not showing on website

1. Check S3 bucket contents:
   ```bash
   aws s3 ls s3://static-sites-outdoor-activities-clothing-romania/
   ```

2. Verify files are public-read:
   ```bash
   aws s3api get-object-acl --bucket static-sites-outdoor-activities-clothing-romania \
       --key muntii_fagaras_above_1800m_weather_plot_7am_10pm.png
   ```

3. Check browser console for errors

### AWS credentials error

```bash
aws configure
# Enter your Access Key ID and Secret Access Key
```

### Bucket doesn't exist

The script will create it automatically on first run. Or create manually:
```bash
aws s3 mb s3://static-sites-outdoor-activities-clothing-romania
```

## Next Steps

1. **Set up CloudFront** for faster global access and custom domain
2. **Enable S3 static website hosting** for cleaner URLs
3. **Add Route 53 custom domain** (e.g., ski-forecast.example.com)
4. **Set up CloudWatch alarms** to monitor script execution

See `S3_SETUP.md` for detailed S3 configuration options.
