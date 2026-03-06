from airflow import DAG
from airflow.providers.standard.operators.bash import BashOperator
from airflow.providers.common.sql.operators.sql import SQLExecuteQueryOperator
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
    schedule=timedelta(minutes=10), # Runs every 10 minutes
    start_date=datetime(2026, 3, 5),
    catchup=False,
    tags=['ais', 'snowflake', 'dbt'],
) as dag:

    # 1. Ingest Data from GCP into Snowflake Bronze Layer
    ingest_raw_data = SQLExecuteQueryOperator(
        task_id='ingest_gcp_to_snowflake',
        conn_id='snowflake_default',
        sql="""
            COPY INTO shipping.raw.raw_ais_data (raw_payload)
            FROM @shipping.public.ais_raw_gcs_stage
            FILE_FORMAT = (TYPE = JSON)
            ON_ERROR = 'CONTINUE';
        """
    )

    # 2. Run dbt Snapshots (SCD Type 2)
    dbt_snapshot = BashOperator(
        task_id='dbt_snapshot',
        bash_command='cd /usr/local/airflow/shipping_tracker && dbt snapshot --profiles-dir .'
    )

    # 3. Run Silver Layer (Staging)
    dbt_run_silver = BashOperator(
        task_id='dbt_run_silver',
        bash_command='cd /usr/local/airflow/shipping_tracker && dbt run --select staging --profiles-dir .'
    )

    # 4. Run Gold Layer (Marts)
    dbt_run_gold = BashOperator(
        task_id='dbt_run_gold',
        bash_command='cd /usr/local/airflow/shipping_tracker && dbt run --select marts --profiles-dir .'
    )

    # Set the dependencies (The Order of Operations)
    ingest_raw_data >> dbt_snapshot >> dbt_run_silver >> dbt_run_gold