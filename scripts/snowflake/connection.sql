create database shipping


CREATE OR REPLACE STORAGE INTEGRATION gcp_ais_integration
  TYPE = EXTERNAL_STAGE
  STORAGE_PROVIDER = 'GCS'
  ENABLED = TRUE
  STORAGE_ALLOWED_LOCATIONS = ('gcs://ais-shipping-data-raw-melb/');

DESCRIBE STORAGE INTEGRATION gcp_ais_integration;

-- Tell Snowflake we are dealing with JSON data
CREATE OR REPLACE FILE FORMAT ais_json_format
  TYPE = JSON
  STRIP_OUTER_ARRAY = TRUE; 

-- Create the Stage using the Integration we just authorized
CREATE OR REPLACE STAGE ais_raw_gcs_stage
  URL = 'gcs://ais-shipping-data-raw-melb/'
  STORAGE_INTEGRATION = gcp_ais_integration
  FILE_FORMAT = ais_json_format;


LIST @ais_raw_gcs_stage;


SELECT $1 FROM @ais_raw_gcs_stage LIMIT 10;