with raw_positions as (
    -- The source macro dynamically injects your database and schema
    select * from {{ source('raw_shipping_data', 'parsed_position_reports') }}
)

select 
    mmsi,
    ship_name,
    -- We grab just the first 19 characters (YYYY-MM-DD HH:MM:SS) 
    -- and explicitly cast it to a native Snowflake Timestamp
    try_to_timestamp_ntz(left(time_utc, 19)) as time_utc,
    latitude,
    longitude,
    speed_over_ground,
    course_over_ground,
    true_heading,
    nav_status
from raw_positions
where latitude is not null 
  and longitude is not null