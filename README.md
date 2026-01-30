# Ski Touring Weather & Clothing Advisor

AI-powered weather forecast and clothing recommendations for ski touring in Romanian mountains.

## 🎯 What It Does

1. **Fetches tomorrow's weather** from Open-Meteo API for mountain locations
2. **Generates AI clothing advice** using a local LLM (Ollama) with strict equipment list
3. **Exports weather data as JSON** for dynamic JavaScript charts
4. **Publishes to S3** as a static website with interactive charts

## 🚀 Quick Start

### Prerequisites

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install and start Ollama with gpt-oss:20b model
ollama run gpt-oss:20b

# Configure AWS credentials
aws configure
```

### Generate & Deploy

```bash
# 1. Generate forecasts and upload data to S3
python mountain_advice.py

# 2. Upload website (first time or after changes)
./upload_website.sh

# 3. View website
# https://static-sites-outdoor-activities-clothing-romania.s3.us-east-1.amazonaws.com/index.html
```

## 📁 Project Structure

```
├── main.py                     # Core clothing agent logic
├── weather.py                  # Weather API integration
├── location.py                 # Location detection
├── mountain_advice.py          # Mountain forecast generator (main script)
├── s3_uploader.py             # S3 upload logic
├── s3_config.py               # S3 configuration
├── upload_website.sh          # Helper to upload index.html
│
├── mountain_locations.json    # Mountain locations database
├── locations.json             # City locations (for main.py)
│
├── web/
│   └── index.html             # Static website
│
└── tomorrow_mountain_forecast_data/
    └── date=YYYY-MM-DD/       # Generated forecasts (local)
        ├── forecast_metadata.json
        ├── *_model_advice.md
        ├── *_weather_data_24h.json
        ├── *_hourly_data_7am_10pm.json
        └── *_weather_report_7am_10pm.txt
```

## 🏔️ Mountain Locations

Currently covers Romanian mountain ranges:
- Muntii Fagaras (Balea Lac, Balea Cascada)
- Muntii Apuseni (Scarisoara, Vartop)
- Muntii Bucegi (Babele, Omu Peak)
- Muntii Retezat (Gentiana Hut)
- Muntii Piatra Craiului (Curmatura, Zarnesti)

Each location has elevation zones (above/below 1800m) for specific forecasts.

## 📊 Output Files

### Uploaded to S3 (public)
- `forecast_metadata.json` - Forecast date and metadata
- `*_model_advice.md` - AI clothing recommendations (using strict equipment list)
- `*_weather_data_24h.json` - Full 24h weather data (cached)
- `*_hourly_data_7am_10pm.json` - 7am-10pm hourly data (used by JavaScript charts)
- `mountain_locations.json` - Location data
- `ski_touring_equipment.json` - Equipment reference list

### Kept locally only
- `*_weather_report_7am_10pm.txt` - Human-readable weather report

## 🤖 How It Works

### Weather Data Pipeline

```
Open-Meteo API → Cache (24h) → Filter (7am-10pm) → Generate Report
```

Weather data is fetched once per day and cached. Only the 7am-10pm window is used for clothing advice.

### AI Clothing Advice

```
Weather Report → Ollama (gpt-oss:20b) → Clothing Recommendations
```

The LLM considers:
- Temperature range
- Wind speed and gusts
- Precipitation
- Snow conditions
- Elevation zone
- Activity type (ski touring)

### Visualization

```
Hourly Data (JSON) → Chart.js (Frontend) → Interactive Charts (temp/wind/precip)
```

## 🌐 Website

The static website (`web/index.html`):
- Modern dark theme with interactive features
- Loads forecast date from `forecast_metadata.json`
- Groups locations by mountain range
- Search/filter by location or mountain range
- Dynamic interactive charts using Chart.js (temperature, wind, precipitation)
- Clothing advice based on strict equipment list from `ski_touring_equipment.json`
- Prominent avalanche bulletin link
- Fully responsive design
- No backend required - pure static HTML/CSS/JavaScript

All files are at S3 bucket root with relative paths for simplicity.

## ⚙️ Configuration

### S3 Bucket

Edit `s3_config.py`:
```python
S3_BUCKET_NAME = "your-bucket-name"
AWS_REGION = "us-east-1"
```

### Mountain Locations

Edit `mountain_locations.json` to add/remove locations:
```json
{
  "mountain_range": "Muntii Fagaras",
  "name": "Balea Lac",
  "latitude": 45.604,
  "longitude": 24.617,
  "elevation": 2036,
  "zone": "above 1800m"
}
```

### LLM Model

Edit `main.py` to change the model:
```python
response = ollama.chat(model='gpt-oss:20b', messages=messages)
```

## 📖 Documentation

- `S3_SETUP.md` - Detailed S3 configuration
- `DEPLOYMENT.md` - Complete deployment guide

## 🔧 Development

### Local Testing

```bash
# Run locally (no S3 upload)
python mountain_advice.py
# Comment out S3 upload code if needed

# View website locally
open web/index.html
# Uses local fallback paths for development
```

### Adding New Locations

1. Add location to `mountain_locations.json`
2. Run `python mountain_advice.py`
3. New location automatically included

### Customizing Clothing Advice

Edit the prompts in `mountain_advice.py`:
```python
weather_system_prompt = "You are an assistant that..."
weather_prompt = f"Based on this forecast..."
```

## 💰 Cost

**Monthly:** < $0.50
- S3 storage: ~10 MB
- S3 requests: Daily uploads
- Data transfer: Minimal

## 🐛 Troubleshooting

### "AWS credentials not found"
```bash
aws configure
```

### "Model not found"
```bash
ollama pull gpt-oss:20b
ollama run gpt-oss:20b
```

### Website shows old date
Delete and re-upload all files:
```bash
python mountain_advice.py
./upload_website.sh
```

### Charts not showing
Ensure hourly JSON data files exist and are accessible. Charts are generated dynamically using JavaScript (Chart.js).

## 📝 License

MIT License - see LICENSE file

## 🤝 Contributing

Add more mountain locations, improve clothing advice prompts, or enhance the UI!
