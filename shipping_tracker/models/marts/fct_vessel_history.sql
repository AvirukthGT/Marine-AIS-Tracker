with positions as (
    select * from {{ ref('stg_position_reports') }}
),

ship_history as (
    select * from {{ ref('snp_ship_static_data') }}
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
left join ship_history s
    on p.mmsi = s.mmsi
    and p.time_utc >= s.dbt_valid_from
    and p.time_utc < coalesce(s.dbt_valid_to, '2099-12-31')