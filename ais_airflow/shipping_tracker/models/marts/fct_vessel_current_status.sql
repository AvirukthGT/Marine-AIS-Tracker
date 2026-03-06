with latest_positions as (
        
    select * from (
        select *,
            row_number() over (partition by mmsi order by time_utc desc) as ping_rank
        from {{ ref('stg_position_reports') }}
    ) 
    where ping_rank = 1
),

active_ship_data as (
    select *
    from {{ ref('snp_ship_static_data') }}
    where dbt_valid_to is null
)

select
    p.mmsi,
    coalesce(s.ship_name, 'UNKNOWN VESSEL') as ship_name,
    s.ship_type,
    s.destination,
    p.latitude,
    p.longitude,
    p.speed_over_ground,
    p.true_heading,
    p.nav_status,
    p.time_utc as last_seen_utc
from latest_positions p
left join active_ship_data s
    on p.mmsi = s.mmsi