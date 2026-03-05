with raw_positions as (
    -- The source macro dynamically injects your database and schema
    select * from {{ source('raw_shipping_data', 'parsed_position_reports') }}
)

select 
    mmsi,
    ship_name,
    time_utc,
    latitude,
    longitude,
    speed_over_ground,
    course_over_ground,
    true_heading,
    nav_status
from raw_positions
where latitude is not null 
  and longitude is not null