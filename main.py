"""
Maritime Overwatch — FastAPI Backend
Serves tactical geospatial AIS data from Snowflake to the React/Deck.gl frontend.
"""

import os
import logging
from contextlib import asynccontextmanager
from datetime import datetime, date
from typing import Generator

import snowflake.connector
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# ─── Configuration ─────────────────────────────────────────────────
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("maritime-api")

SNOWFLAKE_CONFIG = {
    "account": os.environ.get("SNOWFLAKE_ACCOUNT"),
    "user": os.environ.get("SNOWFLAKE_USER"),
    "password": os.environ.get("SNOWFLAKE_PASSWORD"),
    "database": os.environ.get("SNOWFLAKE_DATABASE"),
    "schema": os.environ.get("SNOWFLAKE_SCHEMA"),
    "warehouse": os.environ.get("SNOWFLAKE_WAREHOUSE"),
}

# Validate all env vars are present at startup
_missing = [k for k, v in SNOWFLAKE_CONFIG.items() if not v]
if _missing:
    logger.warning(f"Missing Snowflake env vars: {_missing}")


# ─── App Lifecycle ─────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Maritime Overwatch API starting up")
    logger.info(f"Snowflake account: {SNOWFLAKE_CONFIG['account']}")
    yield
    logger.info("Maritime Overwatch API shutting down")


app = FastAPI(
    title="Maritime Overwatch API",
    description="Tactical geospatial AIS intelligence backend powered by Snowflake",
    version="2.0.0",
    lifespan=lifespan,
)


# ─── CORS Middleware ───────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Next.js / React dev server
        "http://localhost:5173",   # Vite dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Snowflake Connection Dependency ───────────────────────────────
def get_snowflake_connection() -> Generator[snowflake.connector.SnowflakeConnection, None, None]:
    """
    Creates a Snowflake connection and yields it for use in endpoints.
    Automatically closes the connection after the request completes.
    """
    conn = None
    try:
        conn = snowflake.connector.connect(
            account=SNOWFLAKE_CONFIG["account"],
            user=SNOWFLAKE_CONFIG["user"],
            password=SNOWFLAKE_CONFIG["password"],
            database=SNOWFLAKE_CONFIG["database"],
            schema=SNOWFLAKE_CONFIG["schema"],
            warehouse=SNOWFLAKE_CONFIG["warehouse"],
            login_timeout=15,
            network_timeout=30,
        )
        yield conn
    except snowflake.connector.errors.DatabaseError as e:
        logger.error(f"Snowflake connection error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to connect to Snowflake: {str(e)}",
        )
    finally:
        if conn:
            conn.close()


# ─── Helper: Rows → Dicts (with ISO 8601 date handling) ───────────
def rows_to_dicts(cursor) -> list[dict]:
    """Convert cursor results to a list of dicts with lowercase keys.
    Datetime/date values are serialized to ISO 8601 strings for JavaScript."""
    columns = [col[0].lower() for col in cursor.description]
    rows = []
    for row in cursor.fetchall():
        record = {}
        for key, val in zip(columns, row):
            if isinstance(val, (datetime, date)):
                record[key] = val.isoformat()
            else:
                record[key] = val
        rows.append(record)
    return rows


# ─── Endpoints ─────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "service": "Maritime Overwatch API",
        "version": "2.1.0",
        "endpoints": [
            "/api/vessels/live",
            "/api/vessels/zone/{zone_name}",
            "/api/vessels/hvt",
            "/api/intelligence/summary",
            "/api/intelligence/dark-fleet",
            "/api/intelligence/diverted-vessels",
            "/api/intelligence/economic-exposure",
        ],
    }


@app.get("/api/vessels/live")
async def get_live_vessels(
    conn: snowflake.connector.SnowflakeConnection = Depends(get_snowflake_connection),
):
    """
    Returns every vessel in the theater.
    Feeds the main Deck.gl map layer.
    """
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM fct_regional_vessels")
        vessels = rows_to_dicts(cursor)
        cursor.close()

        logger.info(f"Returned {len(vessels)} live vessels")
        return {"count": len(vessels), "vessels": vessels}

    except Exception as e:
        logger.error(f"Error fetching live vessels: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error querying live vessels: {str(e)}",
        )


@app.get("/api/vessels/zone/{zone_name}")
async def get_vessels_by_zone(
    zone_name: str,
    conn: snowflake.connector.SnowflakeConnection = Depends(get_snowflake_connection),
):
    """
    Filters vessels to a specific tactical zone / geopolitical chokepoint.
    Valid zones: CRITICAL_RED_SEA, HIGH_HORMUZ, ELEVATED_ADEN, STANDARD_TRANSIT.
    """
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM fct_regional_vessels WHERE tactical_zone = %s",
            (zone_name,),
        )
        vessels = rows_to_dicts(cursor)
        cursor.close()

        logger.info(f"Returned {len(vessels)} vessels in zone '{zone_name}'")
        return {"zone": zone_name, "count": len(vessels), "vessels": vessels}

    except Exception as e:
        logger.error(f"Error fetching vessels for zone '{zone_name}': {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error querying vessels by zone: {str(e)}",
        )


@app.get("/api/vessels/hvt")
async def get_high_value_targets(
    conn: snowflake.connector.SnowflakeConnection = Depends(get_snowflake_connection),
):
    """
    Returns High-Value Targets (Tankers and Cargo ships) for risk assessment.
    """
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM fct_regional_vessels WHERE is_high_value_target = TRUE"
        )
        vessels = rows_to_dicts(cursor)
        cursor.close()

        logger.info(f"Returned {len(vessels)} high-value targets")
        return {"count": len(vessels), "vessels": vessels}

    except Exception as e:
        logger.error(f"Error fetching high-value targets: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error querying high-value targets: {str(e)}",
        )


@app.get("/api/intelligence/summary")
async def get_intelligence_summary(
    conn: snowflake.connector.SnowflakeConnection = Depends(get_snowflake_connection),
):
    """
    Returns aggregate vessel counts per tactical zone.
    Feeds the tactical UI ticker / summary panels.
    """
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT tactical_zone, COUNT(*) as vessel_count
            FROM fct_regional_vessels
            GROUP BY tactical_zone
            """
        )
        summary = rows_to_dicts(cursor)
        cursor.close()

        total = sum(row["vessel_count"] for row in summary)
        logger.info(f"Intelligence summary: {total} vessels across {len(summary)} zones")
        return {"total_vessels": total, "zones": summary}

    except Exception as e:
        logger.error(f"Error fetching intelligence summary: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error querying intelligence summary: {str(e)}",
        )


@app.get("/api/intelligence/dark-fleet")
async def get_dark_fleet(
    conn: snowflake.connector.SnowflakeConnection = Depends(get_snowflake_connection),
):
    """
    Feeds a dedicated UI panel showing spoofed or hidden vessels.
    """
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM fct_regional_vessels WHERE dark_fleet_suspicion = TRUE")
        vessels = rows_to_dicts(cursor)
        cursor.close()

        logger.info(f"Returned {len(vessels)} dark fleet vessels")
        return {"count": len(vessels), "vessels": vessels}

    except Exception as e:
        logger.error(f"Error fetching dark fleet: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error querying dark fleet: {str(e)}",
        )


@app.get("/api/intelligence/diverted-vessels")
async def get_diverted_vessels(
    conn: snowflake.connector.SnowflakeConnection = Depends(get_snowflake_connection),
):
    """
    Maps the supply chain exodus away from the Red Sea.
    """
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM fct_regional_vessels WHERE is_diverted_cape = TRUE")
        vessels = rows_to_dicts(cursor)
        cursor.close()

        logger.info(f"Returned {len(vessels)} diverted vessels")
        return {"count": len(vessels), "vessels": vessels}

    except Exception as e:
        logger.error(f"Error fetching diverted vessels: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error querying diverted vessels: {str(e)}",
        )


@app.get("/api/intelligence/economic-exposure")
async def get_economic_exposure(
    conn: snowflake.connector.SnowflakeConnection = Depends(get_snowflake_connection),
):
    """
    Powers a live ticker showing the total dollar amount of cargo currently sitting inside the active conflict zones.
    """
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT tactical_zone, SUM(estimated_cargo_value_usd) as total_value_usd 
            FROM fct_regional_vessels 
            WHERE is_high_value_target = TRUE 
            GROUP BY tactical_zone
            """
        )
        exposure = rows_to_dicts(cursor)
        cursor.close()

        logger.info(f"Returned economic exposure for {len(exposure)} zones")
        return {"exposure": exposure}

    except Exception as e:
        logger.error(f"Error fetching economic exposure: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error querying economic exposure: {str(e)}",
        )


# ─── Health Check ──────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    """Quick health check that also tests the Snowflake connection."""
    try:
        conn = snowflake.connector.connect(
            account=SNOWFLAKE_CONFIG["account"],
            user=SNOWFLAKE_CONFIG["user"],
            password=SNOWFLAKE_CONFIG["password"],
            database=SNOWFLAKE_CONFIG["database"],
            schema=SNOWFLAKE_CONFIG["schema"],
            warehouse=SNOWFLAKE_CONFIG["warehouse"],
            login_timeout=10,
        )
        cursor = conn.cursor()
        cursor.execute("SELECT CURRENT_TIMESTAMP()")
        ts = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        return {"status": "healthy", "snowflake_time": str(ts)}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
