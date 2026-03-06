import requests
import json
import time
import os
import logging
from datetime import datetime
from google.cloud import storage

# Configure Standard Logging for GCP/Airflow
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


API_KEY = os.getenv("DATALASTIC_API_KEY")
if not API_KEY:
    raise ValueError("CRITICAL ERROR: DATALASTIC_API_KEY environment variable is missing.")

ENDPOINT = "https://api.datalastic.com/api/v0/vessel_inradius"


GCS_BUCKET_NAME = "ais_raw_gcs_stage" 

# Bounding Box for the Entire Middle East Theater
LAT_START = 12.0
LAT_END = 30.0
LON_START = 32.0
LON_END = 60.0
STEP_SIZE = 1.2 
RADIUS_NM = 50

master_vessel_registry = {}

logging.info("Initializing Regional Geospatial Mesh...")

# 1. Generate the Search Grid
grid_coords = []
current_lat = LAT_START
while current_lat <= LAT_END:
    current_lon = LON_START
    while current_lon <= LON_END:
        grid_coords.append((round(current_lat, 2), round(current_lon, 2)))
        current_lon += STEP_SIZE
    current_lat += STEP_SIZE

logging.info(f"Grid generated. Executing sweep across {len(grid_coords)} oceanic sectors...")

# 2. Execute the Sweep
successful_sweeps = 0

for lat, lon in grid_coords:
    params = {
        'api-key': API_KEY,
        'lat': lat,
        'lon': lon,
        'radius': RADIUS_NM
    }
    
    try:
        response = requests.get(ENDPOINT, params=params)
        
        if response.status_code == 200:
            data = response.json()
            vessels = data.get('data', {}).get('vessels', [])
            
            for v in vessels:
                mmsi = v.get('mmsi')
                if mmsi and mmsi not in master_vessel_registry:
                    master_vessel_registry[mmsi] = v
                    
            successful_sweeps += 1
            
            if successful_sweeps % 10 == 0:
                logging.info(f" > Swept {successful_sweeps}/{len(grid_coords)} sectors. Unique vessels: {len(master_vessel_registry)}")
                
        time.sleep(1) # API Rate Limit compliance
        
    except Exception as e:
        logging.warning(f"Error sweeping sector ({lat}, {lon}): {e}")
        time.sleep(1)
        continue

# 3. Save directly to Google Cloud Storage (The Data Lake)
final_payload = list(master_vessel_registry.values())

# Generating a unique filename using a UTC timestamp so we never overwrite historical data
timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
output_filename = f"datalastic_regional_master_{timestamp}.json"

logging.info("Mesh sweep complete. Initiating transfer to Google Cloud Storage...")

try:
    # Initialize the GCS client
    storage_client = storage.Client()
    bucket = storage_client.bucket(GCS_BUCKET_NAME)
    
    # Defining the folder path and filename inside the bucket
    blob = bucket.blob(f"raw_datalastic/{output_filename}")
    
    # Uploading the JSON string directly from memory (no local file needed)
    blob.upload_from_string(
        data=json.dumps(final_payload, indent=4),
        content_type='application/json'
    )
    
    logging.info(f"[SUCCESS] Payload secured. {len(final_payload)} vessels written to gs://{GCS_BUCKET_NAME}/raw_datalastic/{output_filename}")

except Exception as e:
    logging.error(f"[CRITICAL] Failed to write to GCS: {e}")