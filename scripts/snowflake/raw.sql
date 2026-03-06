use database shipping 
create schema raw

CREATE OR REPLACE TABLE raw_ais_data (
    raw_payload VARIANT,
    ingested_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COPY INTO raw_ais_data (raw_payload)
FROM @public.ais_raw_gcs_stage
ON_ERROR = 'CONTINUE';

SELECT * FROM raw_ais_data LIMIT 10;

CREATE OR REPLACE VIEW parsed_position_reports AS
SELECT
    raw_payload:MetaData.MMSI::INT AS mmsi,
    TRIM(raw_payload:MetaData.ShipName::STRING) AS ship_name,
    raw_payload:MetaData.time_utc::STRING AS time_utc, -- Stored as string to clean in dbt later
    raw_payload:Message.PositionReport.Latitude::FLOAT AS latitude,
    raw_payload:Message.PositionReport.Longitude::FLOAT AS longitude,
    raw_payload:Message.PositionReport.Sog::FLOAT AS speed_over_ground,
    raw_payload:Message.PositionReport.Cog::FLOAT AS course_over_ground,
    raw_payload:Message.PositionReport.TrueHeading::INT AS true_heading,
    raw_payload:Message.PositionReport.NavigationalStatus::INT AS nav_status
FROM raw_ais_data
WHERE raw_payload:MessageType::STRING = 'PositionReport';


CREATE OR REPLACE VIEW parsed_ship_static_data AS
SELECT
    raw_payload:MetaData.MMSI::INT AS mmsi,
    TRIM(raw_payload:MetaData.ShipName::STRING) AS ship_name,
    TRIM(raw_payload:Message.ShipStaticData.Destination::STRING) AS destination,
    raw_payload:Message.ShipStaticData.Type::INT AS ship_type,
    raw_payload:Message.ShipStaticData.Dimension.A::INT AS dimension_to_bow,
    raw_payload:Message.ShipStaticData.Dimension.B::INT AS dimension_to_stern
FROM raw_ais_data
WHERE raw_payload:MessageType::STRING = 'ShipStaticData';


select count(*) from parsed_position_reports 


select count(*) from gold.fct_vessel_history
where ship_name='UNKNOWN VESSEL'

