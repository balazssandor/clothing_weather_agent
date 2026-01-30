"""
S3 Configuration for uploading weather forecast data
"""
import os

# S3 Configuration
S3_BUCKET_NAME = "static-sites-outdoor-activities-clothing-romania"

# AWS region (adjust as needed)
AWS_REGION = "us-east-1"

# File patterns to upload
FILE_PATTERNS = [
    "*_weather_data_24h.json",
    "*_weather_report_7am_6pm.txt",
    "*_model_advice.md",
    "*_hourly_data_7am_6pm.json",
    "*_weather_plot_7am_6pm.png"
]

def get_s3_url(file_path: str) -> str:
    """
    Generate S3 URL for a file (bucket root)

    Args:
        file_path: Local file path (e.g., "muntii_fagaras_above_1800m_weather_plot_7am_6pm.png")

    Returns:
        Full S3 URL
    """
    filename = os.path.basename(file_path)
    return f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{filename}"
