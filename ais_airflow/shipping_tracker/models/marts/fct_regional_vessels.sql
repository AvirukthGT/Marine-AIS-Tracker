with mesh_data as (
    select * from {{ ref('stg_datalastic_mesh') }}
),

deduplicated_vessels as (
    select *
    from mesh_data
    -- The ultimate deduplication weapon: 
    -- Groups by MMSI and keeps only the absolute most recent ping for that ship
    qualify row_number() over (partition by mmsi order by time_utc desc) = 1
)

select
    -- Core Identifiers
    mmsi,
    imo_number,
    coalesce(ship_name, 'UNKNOWN CONTACT') as ship_name,
    flag_state,
    
    -- Vessel Categorization
    ship_type,
    ship_type_detailed,
    
    -- Voyage Data
    destination,
    eta_utc,
    
    -- Telemetry
    latitude,
    longitude,
    speed_over_ground,
    course_over_ground,
    true_heading,
    time_utc as last_ping_utc,

    -- ==========================================
    -- TACTICAL INTELLIGENCE LAYER
    -- ==========================================

    -- Feature 1: Dynamic Conflict Zone Tagging
    -- We draw invisible geospatial bounding boxes over the data to assign risk
    case
        -- Bab el-Mandeb / Southern Red Sea (Houthi Conflict Zone)
        when latitude between 12.0 and 16.0 and longitude between 41.0 and 45.0 then 'CRITICAL_RED_SEA'
        
        -- Strait of Hormuz (Iranian Transit Chokepoint)
        when latitude between 25.0 and 27.5 and longitude between 55.0 and 57.5 then 'HIGH_HORMUZ'
        
        -- Gulf of Aden (Piracy/Transit Corridor)
        when latitude between 11.0 and 15.0 and longitude between 45.0 and 51.0 then 'ELEVATED_ADEN'
        
        else 'STANDARD_TRANSIT'
    end as tactical_zone,

    -- Feature 2: High-Value Target (HVT) Identification
    -- Flags specific vessel classes that are sensitive to supply chain disruptions
    case
        when ship_type in ('Tanker', 'Cargo') then TRUE
        else FALSE
    end as is_high_value_target,

    -- Feature 3: Dark Fleet Suspicion
    -- Flags vessels moving > 0.5 kn with AIS delayed > 12 hours
    case
        when speed_over_ground > 0.5 and datediff('hour', time_utc, current_timestamp()) > 12 then TRUE
        else FALSE
    end as dark_fleet_suspicion,

    -- Feature 4: Diverted via Cape of Good Hope
    -- Flags vessels abandoning Suez to go around Africa
    case
        when upper(destination) like '%CAPE%' 
          or upper(destination) like '%CGH%' 
          or upper(destination) like '%HOPE%' then TRUE
        else FALSE
    end as is_diverted_cape,

    -- Feature 5: Estimated Cargo Value (USD)
    -- Estimates value based on ship type
    case
        when ship_type = 'Tanker' then 150000000
        when ship_type = 'Cargo' then 100000000
        else 0
    end as estimated_cargo_value_usd

from deduplicated_vessels