with raw_static_data as (
    select * from {{ source('raw_shipping_data', 'parsed_ship_static_data') }}
)

select
    mmsi,
    trim(ship_name) as ship_name,
    trim(destination) as destination,
    ship_type,
    dimension_to_bow,
    dimension_to_stern
from raw_static_data
-- Filter out records without an MMSI, as a ship without an ID cannot be joined to our map
where mmsi is not null