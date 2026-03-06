{% snapshot snp_ship_static_data %}

{{
    config(
      target_database=target.database,
      target_schema='snapshots',
      unique_key='mmsi',
      strategy='check',
      check_cols=['destination', 'ship_name', 'ship_type']
    )
}}


select 
    mmsi,
    trim(ship_name) as ship_name,
    trim(destination) as destination,
    ship_type,
    dimension_to_bow,
    dimension_to_stern
from {{ source('raw_shipping_data', 'parsed_ship_static_data') }}
where mmsi is not null
qualify row_number() over (partition by mmsi order by ship_name, destination) = 1

{% endsnapshot %}