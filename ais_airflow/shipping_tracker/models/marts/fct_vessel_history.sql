with positions as (
    select * from {{ ref('stg_position_reports') }}
),

active_ship_data as (
    -- We just grab whatever the most recent static data is
    select * from {{ ref('snp_ship_static_data') }}
    where dbt_valid_to is null
)

select
    p.mmsi,
    coalesce(s.ship_name, 'UNKNOWN VESSEL') as ship_name,
    s.ship_type,
    s.destination,
    s.dimension_to_bow,
    s.dimension_to_stern,
    p.latitude,
    p.longitude,
    p.speed_over_ground,
    p.course_over_ground,
    p.true_heading,
    p.nav_status,
    p.time_utc as ping_time_utc
from positions p
left join active_ship_data s
    on p.mmsi = s.mmsi