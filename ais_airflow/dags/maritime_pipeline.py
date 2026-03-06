from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.providers.snowflake.operators.snowflake import SnowflakeOperator
from datetime import datetime, timedelta

# Default settings for the pipeline
default_args = {
    'owner': 'data_engineer',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

# Define the DAG
with DAG(
    'maritime_tracking_pipeline',
    default_args=default_args,
    description='End-to-end AIS ingestion and dbt transformation',
    schedule_interval=timedelta(minutes=10), # Runs every 10 minutes
    start_date=datetime(2026, 3, 5),
    catchup=False,
    tags=['ais', 'snowflake', 'dbt'],
) as dag:

    # 1. Ingest Data from GCP into Snowflake Bronze Layer
    ingest_raw_data = SnowflakeOperator(
        task_id='ingest_gcp_to_snowflake',
        snowflake_conn_id='snowflake_default', # We will configure this in the Airflow UI
        sql="""
            COPY INTO raw_ais_data (raw_payload)
            FROM @ais_raw_gcs_stage
            ON_ERROR = 'CONTINUE';
        """
    )

    # Note: The BashOperator paths will point to where your dbt project lives 
    # inside the Airflow Docker container.

    # 2. Run dbt Snapshots (SCD Type 2)
    dbt_snapshot = BashOperator(
        task_id='dbt_snapshot',
        bash_command='cd /usr/local/airflow/dbt/shipping_tracker && dbt snapshot'
    )

    # 3. Run Silver Layer (Staging)
    dbt_run_silver = BashOperator(
        task_id='dbt_run_silver',
        bash_command='cd /usr/local/airflow/dbt/shipping_tracker && dbt run --select staging'
    )

    # 4. Run Gold Layer (Marts)
    dbt_run_gold = BashOperator(
        task_id='dbt_run_gold',
        bash_command='cd /usr/local/airflow/dbt/shipping_tracker && dbt run --select marts'
    )

    # Set the dependencies (The Order of Operations)
    ingest_raw_data >> dbt_snapshot >> dbt_run_silver >> dbt_run_gold