"""
S3 Uploader for weather forecast data
"""
import os
import glob
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from s3_config import S3_BUCKET_NAME, AWS_REGION


def upload_directory_to_s3(local_dir: str, date_str: str = None, dry_run: bool = False, include_config: bool = True) -> bool:
    """
    Upload all files from a local directory to S3 bucket preserving directory structure.

    Files are uploaded to their corresponding path in S3 (e.g., tomorrow_mountain_forecast_data/date=YYYY-MM-DD/file.json).

    Args:
        local_dir: Local directory path (e.g., "tomorrow_mountain_forecast_data/date=2026-01-28")
        date_str: Date string (not used, kept for compatibility)
        dry_run: If True, only print what would be uploaded without actually uploading
        include_config: If True, also upload mountain_locations.json (default: True)

    Returns:
        True if successful, False otherwise
    """
    try:
        # Initialize S3 client
        s3_client = boto3.client('s3', region_name=AWS_REGION)

        # Check if bucket exists, create if it doesn't
        try:
            s3_client.head_bucket(Bucket=S3_BUCKET_NAME)
            print(f"✓ Bucket '{S3_BUCKET_NAME}' exists")
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                print(f"Creating bucket '{S3_BUCKET_NAME}'...")
                if not dry_run:
                    s3_client.create_bucket(Bucket=S3_BUCKET_NAME)
                    # Allow public bucket policies (ACLs remain blocked, we use policies instead)
                    s3_client.put_public_access_block(
                        Bucket=S3_BUCKET_NAME,
                        PublicAccessBlockConfiguration={
                            'BlockPublicAcls': True,        # Keep ACLs blocked (modern best practice)
                            'IgnorePublicAcls': True,       # Keep ACLs blocked
                            'BlockPublicPolicy': False,     # Allow public bucket policies
                            'RestrictPublicBuckets': False  # Allow public bucket policies
                        }
                    )
                print(f"✓ Bucket created")
            else:
                raise

        # Get all files in the directory
        files = glob.glob(os.path.join(local_dir, "*"))

        # Also include configuration files from project root (needed by website)
        if include_config:
            config_files = [
                "mountain_locations.json",
                "ski_touring_equipment.json",
                "popup_advice.txt",
                "clothing_per_temp_feel.json",
                "clothing_per_temp_feel_ro.json",
                "clothing_per_temp_feel_hu.json"
            ]
            for config_file in config_files:
                if os.path.exists(config_file):
                    files.append(config_file)
                else:
                    print(f"⚠️  Warning: {config_file} not found")

        if not files:
            print(f"⚠️  No files found in {local_dir}")
            return False

        uploaded_count = 0

        for file_path in files:
            if os.path.isfile(file_path):
                filename = os.path.basename(file_path)

                # Preserve directory structure for forecast data, config files go to root
                if local_dir in file_path:
                    # Use the local_dir as the S3 prefix (e.g., tomorrow_mountain_forecast_data/date=.../file.json)
                    s3_key = os.path.join(local_dir, filename)
                else:
                    s3_key = filename  # Config files go to bucket root

                # Determine content type
                content_type = 'application/octet-stream'
                if filename.endswith('.json'):
                    content_type = 'application/json'
                elif filename.endswith('.txt'):
                    content_type = 'text/plain'
                elif filename.endswith('.md'):
                    content_type = 'text/markdown'
                elif filename.endswith('.png'):
                    content_type = 'image/png'

                if dry_run:
                    print(f"[DRY RUN] Would upload: {filename} -> s3://{S3_BUCKET_NAME}/{s3_key}")
                else:
                    print(f"Uploading {filename}...", end=' ')
                    s3_client.upload_file(
                        file_path,
                        S3_BUCKET_NAME,
                        s3_key,
                        ExtraArgs={
                            'ContentType': content_type
                            # ACL removed - using bucket policy instead
                        }
                    )
                    print("✓")

                uploaded_count += 1

        if not dry_run:
            print(f"\n✅ Successfully uploaded {uploaded_count} files to S3")
            print(f"📍 S3 Bucket: s3://{S3_BUCKET_NAME}/")
            print(f"🌐 Public URL: https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/")
        else:
            print(f"\n[DRY RUN] Would upload {uploaded_count} files")

        return True

    except NoCredentialsError:
        print("❌ AWS credentials not found. Please configure AWS credentials:")
        print("   - Run: aws configure")
        print("   - Or set environment variables: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
        return False
    except ClientError as e:
        print(f"❌ AWS Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error uploading to S3: {e}")
        return False


def configure_bucket_policy(bucket_name: str = S3_BUCKET_NAME) -> bool:
    """
    Configure bucket policy to make all objects publicly readable

    This is the modern approach (replaces ACLs which are often disabled)

    Returns:
        True if successful, False otherwise
    """
    try:
        import json
        s3_client = boto3.client('s3', region_name=AWS_REGION)

        # Bucket policy that makes all objects public
        bucket_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "PublicReadGetObject",
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject",
                    "Resource": f"arn:aws:s3:::{bucket_name}/*"
                }
            ]
        }

        s3_client.put_bucket_policy(
            Bucket=bucket_name,
            Policy=json.dumps(bucket_policy)
        )

        print(f"✓ Bucket policy applied to '{bucket_name}' (all objects now public)")
        return True

    except ClientError as e:
        print(f"❌ Error configuring bucket policy: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


def configure_bucket_cors(bucket_name: str = S3_BUCKET_NAME) -> bool:
    """
    Configure CORS for the S3 bucket to allow web access

    Returns:
        True if successful, False otherwise
    """
    try:
        s3_client = boto3.client('s3', region_name=AWS_REGION)

        cors_configuration = {
            'CORSRules': [
                {
                    'AllowedHeaders': ['*'],
                    'AllowedMethods': ['GET', 'HEAD'],
                    'AllowedOrigins': ['*'],
                    'ExposeHeaders': [],
                    'MaxAgeSeconds': 3000
                }
            ]
        }

        s3_client.put_bucket_cors(
            Bucket=bucket_name,
            CORSConfiguration=cors_configuration
        )

        print(f"✓ CORS configuration applied to bucket '{bucket_name}'")
        return True

    except ClientError as e:
        print(f"❌ Error configuring CORS: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


if __name__ == "__main__":
    import sys
    from datetime import date, timedelta

    # Example usage
    tomorrow = date.today() + timedelta(days=1)
    date_str = tomorrow.isoformat()
    local_dir = os.path.join("tomorrow_mountain_forecast_data", f"date={date_str}")

    print("S3 Uploader for Weather Forecast Data")
    print("=" * 50)

    # Check if dry run
    dry_run = '--dry-run' in sys.argv

    if dry_run:
        print("🔍 Running in DRY RUN mode (no files will be uploaded)\n")

    # Upload files
    if os.path.exists(local_dir):
        success = upload_directory_to_s3(local_dir, date_str, dry_run=dry_run)
        if success and not dry_run:
            # Configure bucket policy and CORS
            print("\nConfiguring bucket policy...")
            configure_bucket_policy()
            print("\nConfiguring CORS...")
            configure_bucket_cors()
    else:
        print(f"❌ Directory not found: {local_dir}")
        print("Please run mountain_advice.py first to generate the forecast data.")
