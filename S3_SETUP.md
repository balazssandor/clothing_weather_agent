# S3 Upload Setup

This guide explains how to set up S3 uploads for your weather forecast data to make it accessible as a public static website.

## Quick Start

1. **Configure AWS credentials:** `aws configure`
2. **Generate and upload data:** `python mountain_advice.py`
3. **Upload website:** `./upload_website.sh`
4. **Visit:** https://static-sites-outdoor-activities-clothing-romania.s3.us-east-1.amazonaws.com/index.html

## Overview

The weather forecast data is automatically uploaded to S3 after generation, making it accessible as a static website. The web interface (index.html) and data files live together in the same bucket root.

**S3 Bucket Structure:**

All files are uploaded directly to the bucket root (no subfolders). Files are overwritten each time with the latest forecast.

```
s3://static-sites-outdoor-activities-clothing-romania/
├── index.html                                             ← (you upload manually)
├── forecast_metadata.json                                 ← (script uploads - contains date)
├── muntii_fagaras_above_1800m_weather_data_24h.json      ← (script uploads)
├── muntii_fagaras_above_1800m_weather_report_7am_10pm.txt
├── muntii_fagaras_above_1800m_model_advice.md
├── muntii_fagaras_above_1800m_hourly_data_7am_10pm.json
├── muntii_fagaras_above_1800m_weather_plot_7am_10pm.png
├── muntii_apuseni_above_1800m_weather_data_24h.json
├── muntii_apuseni_above_1800m_model_advice.md
└── ... (all other locations)
```

**forecast_metadata.json** contains:
```json
{
  "forecast_date": "2026-01-28",
  "generated_at": "2026-01-27",
  "locations_count": 10,
  "time_window": "7am-10pm"
}
```

This allows `index.html` to know exactly what date the forecast is for.

**Simple and Clean:**
- All files in one place at bucket root
- index.html uses relative paths (`./filename`)
- Files overwritten each run with latest forecast
- No date folders, no complicated paths

## AWS Credentials Setup

### Option 1: AWS CLI (Recommended)

1. Install AWS CLI:
   ```bash
   pip install awscli
   ```

2. Configure your credentials:
   ```bash
   aws configure
   ```

   Enter your:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region (e.g., `us-east-1`)
   - Default output format (e.g., `json`)

### Option 2: Environment Variables

Set these environment variables:
```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```

## Usage

### Automatic Upload

When you run `mountain_advice.py`, data is automatically uploaded to S3 after generation:

```bash
python mountain_advice.py
```

Output will show:
```
✅ All forecasts generated successfully!
📄 Open web/index.html to view all locations

============================================================
📤 Uploading data to S3...
============================================================
✓ Bucket 'static-sites-outdoor-activities-clothing-romania' exists
Uploading muntii_fagaras_above_1800m_weather_data_24h.json... ✓
Uploading muntii_fagaras_above_1800m_weather_plot_7am_10pm.png... ✓
Uploading muntii_fagaras_above_1800m_model_advice.md... ✓
...

✅ Successfully uploaded 45 files to S3
📍 S3 Bucket: s3://static-sites-outdoor-activities-clothing-romania/
🌐 Public URL: https://static-sites-outdoor-activities-clothing-romania.s3.us-east-1.amazonaws.com/

🔧 Configuring CORS for web access...
✓ CORS configuration applied to bucket 'static-sites-outdoor-activities-clothing-romania'

🌐 Data is now available online!
📍 S3 URL: https://static-sites-outdoor-activities-clothing-romania.s3.us-east-1.amazonaws.com/

💡 Upload index.html to the same bucket root for the complete website
   The web page uses relative paths to load data files from the same bucket
```

### Manual Upload

You can also upload files manually using the standalone script:

```bash
# Upload with dry-run (preview only)
python s3_uploader.py --dry-run

# Actual upload
python s3_uploader.py
```

## Bucket Configuration

### CORS Settings

CORS (Cross-Origin Resource Sharing) is automatically configured to allow the web interface to load data from S3. The configuration allows:
- **Methods:** GET, HEAD
- **Origins:** * (all origins)
- **Headers:** * (all headers)

### Public Access

Files are uploaded with `public-read` ACL, making them accessible via direct URLs at the bucket root:

```
https://static-sites-outdoor-activities-clothing-romania.s3.us-east-1.amazonaws.com/muntii_fagaras_above_1800m_weather_plot_7am_10pm.png
https://static-sites-outdoor-activities-clothing-romania.s3.us-east-1.amazonaws.com/muntii_fagaras_above_1800m_model_advice.md
```

## Web Interface Integration

The web interface (`web/index.html`) uses **relative paths** to load data files:

1. **Upload index.html** to the same S3 bucket root
2. **Data files are already there** (uploaded by the script)
3. **index.html loads files using relative paths** (`./filename`)
4. **Falls back to local files** during development

**Benefits:**
- Simple flat structure (all files at bucket root)
- Relative paths work seamlessly
- Files overwritten each run with latest forecast
- No complicated folder hierarchies

### How to Upload index.html

**Option 1: Use the provided script (easiest)**

```bash
./upload_website.sh
```

**Option 2: Manual AWS CLI**

```bash
aws s3 cp web/index.html s3://static-sites-outdoor-activities-clothing-romania/ \
    --acl public-read \
    --content-type "text/html"
```

**Option 3: Use the S3 console**

Upload `web/index.html` manually through the AWS S3 console and set permissions to public-read.

Then access your site at:
```
https://static-sites-outdoor-activities-clothing-romania.s3.us-east-1.amazonaws.com/index.html
```

## Troubleshooting

### "AWS credentials not found"

**Solution:** Configure AWS credentials using one of the methods above.

### "Access Denied" error

**Causes:**
- Invalid AWS credentials
- Insufficient IAM permissions

**Required IAM Permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:PutBucketCORS",
        "s3:PutPublicAccessBlock"
      ],
      "Resource": [
        "arn:aws:s3:::static-sites-outdoor-activities-clothing-romania",
        "arn:aws:s3:::static-sites-outdoor-activities-clothing-romania/*"
      ]
    }
  ]
}
```

### Bucket already exists (owned by someone else)

**Solution:** Change the bucket name in `s3_config.py`:
```python
S3_BUCKET_NAME = "your-unique-bucket-name"
```

No changes needed in `web/index.html` since it uses relative paths!

## Cost Considerations

### S3 Pricing (approximate)

- **Storage:** ~$0.023 per GB/month
- **GET requests:** $0.0004 per 1,000 requests
- **PUT requests:** $0.005 per 1,000 requests

**Estimated monthly cost:** < $1 for typical usage (daily updates, moderate traffic)

### Cost Optimization

Since files are overwritten each time at the bucket root, there's no accumulation of historical data to worry about.

**Cost savings:**
- Only stores current forecast (no historical archives)
- Files are reasonably sized (~50-100KB each for images, small JSON/text files)
- Simple structure with minimal storage overhead
- Only public-read access (no expensive operations)

**Estimated monthly cost:** < $0.50 for typical usage (daily updates, moderate traffic)

## Advanced Configuration

### Change AWS Region

Edit `s3_config.py`:
```python
AWS_REGION = "eu-west-1"  # Change to your preferred region
```

### Disable S3 Upload

If you want to disable S3 uploads, comment out the upload code in `mountain_advice.py`:

```python
# # Upload to S3
# upload_success = upload_directory_to_s3(output_dir, tomorrow.isoformat())
```

The web interface will automatically fall back to local files.

### Static Website Hosting

To enable proper static website hosting on S3:

```bash
# Enable static website hosting
aws s3 website s3://static-sites-outdoor-activities-clothing-romania/ \
  --index-document index.html

# Access via website endpoint (no .s3. in URL)
# http://static-sites-outdoor-activities-clothing-romania.s3-website-us-east-1.amazonaws.com/
```

This provides a cleaner URL and proper index.html handling.
