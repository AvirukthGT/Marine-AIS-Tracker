with raw_mesh_data as (
    select * from {{ source('raw_shipping_data', 'RAW_DATALASTIC_MASTER') }}
)

select 
    -- Identifiers
    raw_payload:mmsi::string as mmsi,
    raw_payload:imo::string as imo_number,
    raw_payload:name::string as ship_name,
    raw_payload:country_iso::string as flag_state,
    
    -- Vessel Categorization
    raw_payload:type::string as ship_type,
    raw_payload:type_specific::string as ship_type_detailed,
    
    -- Voyage Intelligence
    raw_payload:destination::string as destination,
    raw_payload:eta_UTC::timestamp_ntz as eta_utc,
    
    -- Telemetry & Geospatial
    raw_payload:lat::float as latitude,
    raw_payload:lon::float as longitude,
    raw_payload:speed::float as speed_over_ground,
    raw_payload:course::float as course_over_ground,
    raw_payload:heading::float as true_heading,
    
    -- Timestamps
    raw_payload:last_position_UTC::timestamp_ntz as time_utc,
    raw_payload:uuid::string as unique_ping_id
    
from raw_mesh_data
-- Filtering out any corrupted records missing coordinates
where raw_payload:lat is not null 
  and raw_payload:lon is not null