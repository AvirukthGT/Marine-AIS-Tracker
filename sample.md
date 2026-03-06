# AeroStream: Real-Time Flight Efficiency Engine

![Vue.js](https://img.shields.io/badge/Frontend-Vue.js_3-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Build_Tool-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Databricks](https://img.shields.io/badge/Compute-Databricks-FF3621?style=for-the-badge&logo=databricks&logoColor=white)
![Azure Data Factory](https://img.shields.io/badge/Orchestration-Azure_Data_Factory-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)
![ADLS Gen2](https://img.shields.io/badge/Storage-ADLS_Gen2-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)
![Key Vault](https://img.shields.io/badge/Security-Azure_Key_Vault-000000?style=for-the-badge&logo=microsoftazure&logoColor=white)
![Python](https://img.shields.io/badge/Language-Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

[Click here for demo](https://youtu.be/Qfh5VEB_I-g?si=-YDyiB88I5qHguf4)

## Problem Statement


### The Efficiency Blind Spot in Modern Aviation

Commercial aviation is an industry defined by razor-thin margins, where fuel costs typically represent 20-30% of an airline's total operating expenses. While flight paths are meticulously planned before takeoff, the dynamic reality of the atmosphere, shifting wind vectors, unexpected thermal gradients, and jet streams, often renders these plans obsolete the moment wheels leave the ground. A pilot fighting a 100 km/h headwind burns significantly more fuel to maintain schedule, yet traditional tracking tools often fail to contextualize this struggle.

Most existing flight tracking systems provide only positional awareness, answering the question, *"Where is the plane?"* They lack the integrated intelligence to answer the far more critical operational question, *"How efficiently is the plane flying?"* Analysts and ground controllers are often forced to toggle between radar displays, weather maps, and performance charts to gauge fleet health. This fragmentation creates a data blind spot, making it difficult to instantly identify which aircraft are underperforming due to environmental factors versus mechanical drag, leading to reactive rather than proactive decision-making.

---

## The Solution

**AeroStream** is an operational intelligence engine designed to close this gap by fusing live flight telemetry with hyper-local atmospheric data. Rather than treating weather and flight paths as separate datasets, the system integrates them into a single, cohesive data product. By ingesting real-time aircraft positions from the OpenSky API and matching them spatially with the nearest weather stations via the OpenMeteo API, AeroStream creates a rich, multi-dimensional view of every flight’s operating environment.

At the heart of the platform lies a physics-aware Machine Learning model that serves as an automated auditor for flight performance. By analyzing altitude, temperature, and wind resistance, the model calculates the theoretical "Optimal Velocity" for every aircraft in the sky. The system then compares this benchmark against the actual ground speed to generate a live "Efficiency Score." This allows the system to mathematically distinguish between a pilot skillfully riding a tailwind and one burning excess fuel to fight a headwind.

This intelligence is delivered through a modern, web-based dashboard that transforms raw data into instant situational awareness. Instead of presenting a cluttered map of thousands of neutral dots, AeroStream visualizes the fleet's performance spectrum: highly efficient flights glow green, while those struggling against drag or weather highlight in red. This empowers airline analysts to move beyond simple tracking and start managing the true physics of their fleet in real-time.

---

## Tech Stack

I utilized a modern **Lakehouse Architecture** hosted entirely on Microsoft Azure, designed to handle the velocity of flight telemetry and the volume of historical weather data.

* **Cloud Storage & Lakehouse**: **Azure Data Lake Storage (ADLS) Gen2**
    * Serves as the unified storage layer for the **Medallion Architecture** (Bronze/Silver/Gold).
    * Implements **Delta Lake** protocol to ensure ACID transactions and schema enforcement on raw JSON files.
* **Data Processing Engine**: **Azure Databricks (Apache Spark)**
    * The core compute engine for all ETL and ELT workloads.
    * Utilizes **PySpark** for distributed processing, handling complex spatio-temporal joins between moving aircraft and static weather stations.
* **Orchestration**: **Azure Data Factory (ADF)**
    * Manages the end-to-end pipeline lifecycle, triggering ingestion jobs and Databricks notebooks.
    * Decouples the **Training Pipeline** (Weekly) from the **Inference Pipeline** (Hourly) to optimize compute costs.
* **Machine Learning**: **Spark MLlib**
    * Selected for its ability to train models on distributed datasets without sampling.
    * Handles feature vectorization and trains the Linear Regression model used for generating the `Efficiency_Score`.
* **Backend API**: **FastAPI**
    * A high-performance asynchronous Python framework that bridges the gap between the Data Lake and the Web App.
    * Acts as a secure proxy, managing Databricks authentication tokens so they are never exposed to the client.
* **Frontend**: **Vue.js 3 + Vite**
    * A lightweight, reactive framework chosen for its speed and modular component architecture.
    * Integrates **Leaflet.js** to render interactive, geospatial maps capable of plotting hundreds of live flight vectors.
* **Security**: **Azure Key Vault**
    * Centralizes the management of secrets, ensuring that API keys (OpenSky, OpenMeteo) and storage credentials are never hardcoded in the codebase.
* **Deployment**: **Render (Backend) & Vercel (Frontend)**
    * Provides a scalable, serverless production environment that automatically deploys updates via Git triggers.
 
---
## Project Structure

```
AeroStream/
├── backend/                  # FastAPI Application (The Bridge)
│   ├── venv/                 # Python Virtual Environment
│   ├── .env                  # Secrets (DB_TOKEN, DB_HOST) - *Not committed to Git*
│   ├── main.py               # API Endpoints & CORS configuration
│   └── requirements.txt      # Python dependencies for Render
├── databricks/               # Spark & ML Notebooks (The Brain)
│   ├── 01_raw_staging.ipynb      # Bronze Layer: Ingestion from ADLS
│   ├── 02_processing.ipynb       # Silver Layer: Cleaning & Parsing
│   ├── 03_gold_presentation.ipynb # Gold Layer: Joins & ML Inference
│   └── 04_model_training.ipynb   # (Optional) Weekly Training logic
├── dataset/                  # ADF Dataset Definitions (JSON)
│   ├── DS_ADLS_Bronze_Flights.json   # Connection to Data Lake
│   ├── DS_OpenMeteo_Weather.json     # Connection to Weather API
│   └── ...
├── factory/                  # ADF Factory Configuration
│   └── AeroStream.json       # Main Data Factory resource definition
├── frontend/                 # Vue.js 3 + Vite App (The Face)
│   ├── public/               # Static assets
│   ├── src/                  # Vue components & Logic
│   ├── package.json          # Node.js dependencies
│   └── vite.config.js        # Build configuration for Vercel
├── linkedService/            # ADF Connection Strings (JSON)
│   ├── LS_ADLS_Gen2.json     # Azure Data Lake Storage Auth
│   ├── LS_AzureDatabricks.json # Databricks Cluster connection
│   ├── LS_KeyVault.json      # Secure credential retrieval
│   └── ...
├── pipeline/                 # ADF Pipeline Logic
│   └── PL_Master_Orchestrator.json # The defined workflow JSON
└── README.md                 # Project Documentation
```


### **Component Breakdown**

* **`backend/`**: A lightweight Python API that secures your Databricks credentials. It accepts requests from the frontend, queries the `presentation` schema, and returns JSON, keeping your infrastructure secure.
* **`databricks/`**: Contains the core logic. These notebooks handle the **Medallion Architecture** transformations, from raw JSON ingestion to the complex spatial joins that link moving aircraft to stationary weather towers.
* **`dataset/` & `linkedService/**`: Infrastructure-as-Code (IaC) definitions for Azure Data Factory. These JSON files define *what* data we talk to (APIs, Storage) and *how* we authenticate (Key Vault).
* **`frontend/`**: The reactive web application. It fetches live data from the backend and renders it onto an interactive geospatial map using **Leaflet.js**, providing the final visual layer for the user.



## Pipeline Architecture
<img width="7255" height="4763" alt="data_model - Page 12 (2)" src="https://github.com/user-attachments/assets/f4439a9c-e9d3-4f95-bbaa-ba2210913816" />


<img width="1192" height="399" alt="image" src="https://github.com/user-attachments/assets/aa5ce035-6ef7-465a-b090-1bbe9eab884f" />


### 1. Data Ingestion Layer (Extraction)

The entry point of the AeroStream platform is a robust extraction engine managed by **Azure Data Factory (ADF)**. This layer is responsible for interfacing with external third-party APIs and ensuring the reliable delivery of raw telemetry to our data lake.

* **Orchestration Engine:**
    * **Azure Data Factory (ADF):** We utilize ADF as the central control plane. It manages the scheduling, error handling, and parallel execution of data fetch operations.

* **Data Sources & Connectivity:**
    * **Flight Telemetry (OpenSky API):**
        * **Connection Protocol:** Connected via a generic **REST Linked Service**.
        * **Data Payload:** Fetches real-time state vectors including ICAO24 addresses, barometric altitude, velocity, and geometric position.
    * **Weather Conditions (OpenMeteo API):**
        * **Connection Protocol:** Connected via an **HTTP Linked Service**.
        * **Data Payload:** Retrieves hyper-local weather metrics (Wind Speed, Direction, Temperature) corresponding to the specific coordinates of the target flight paths.

* **Execution Flow:**
    * **Parallel Ingestion:** To minimize latency, ADF executes the `Copy Flights Data` and `Copy Weather Data` activities in parallel rather than sequentially. This ensures that weather conditions are captured at the exact same moment as the flight position, maintaining temporal consistency.
    * **Landing Zone:** The raw JSON responses are written directly to the **RAW** container in **Azure Data Lake Storage (ADLS) Gen2**. Storing data in its native format ensures full replayability and provides an immutable audit trail before any transformations are applied.

<img width="746" height="470" alt="image" src="https://github.com/user-attachments/assets/f7bed56d-2059-439b-a235-a06db98faff7" />

ingesting flight data

<img width="748" height="648" alt="image" src="https://github.com/user-attachments/assets/232a9103-5be5-452a-80eb-4601d7c93488" />

ingesting weather data

<img width="254" height="348" alt="image" src="https://github.com/user-attachments/assets/9d9aa8eb-eb20-4200-9a2d-bed5350bf339" />

parallel ingestion

### 2. Processing Layer (Medallion Architecture)

Once raw data lands in the lake, the processing responsibility shifts to **Azure Databricks**. We utilize a multi-hop **Medallion Architecture** to incrementally improve data quality, moving from raw inputs to business-level aggregates.

* **Computing Engine:**
    * **Apache Spark (PySpark):** All transformations are executed on Databricks clusters, leveraging distributed computing to handle the volume of flight telemetry.
    * **Unity Catalog:** Used as the central governance layer to manage tables and schemas across the workspace.

#### **Bronze Layer (Raw Staging)**
* **Notebook:** `01_raw_staging.ipynb`
* **Objective:** To ingest data from the ADLS `RAW` container without data loss.
* **Process:**
    * Reads the parallel streams of Flight and Weather JSON files.
    * Applies initial schema enforcement to reject corrupt files.
    * Loads data into the `Catalog Table: Raw` as-is, preserving the original nested structure.

#### **Silver Layer (Cleaning & Transformation)**
* **Notebook:** `02_processing.ipynb`
* **Objective:** To clean, deduplicate, and validate the data.
* **Process:**
    * **Flattening:** Explodes the nested JSON arrays from the OpenSky API into flat, columnar rows.
    * **Type Casting:** Converts string timestamps (ISO 8601) into proper Spark Timestamp types.
    * **Quality Checks:** Runs validation logic (as seen in the sequence flow) to flag anomalies before writing to the `Silver Schema`.

#### **Gold Layer (Enrichment & ML)**
* **Notebook:** `03_gold_presentation.ipynb` & `04_model_training.ipynb`
* **Objective:** To fuse datasets and generate predictive insights.
* **The "Join" Challenge:**
    * Since planes are constantly moving, their coordinates never perfectly match a static weather station.
    * **Solution:** We implement a **Spatio-Temporal Join** that matches aircraft to the nearest weather station within a specific time window and geographic radius.
* **MLOps Integration:**
    * **Model Train:** A scheduled pipeline re-trains the model on historical Gold data.
    * **Model Inference:** The inference pipeline scores the live data, adding `Predicted_Velocity` and `Efficiency_Score` columns.
    * **Final Output:** The enriched data is written to the `PRESENTATION` container in ADLS, ready for the serving layer.
    * 
<img width="504" height="273" alt="image" src="https://github.com/user-attachments/assets/a62ea5fc-e22f-4a45-bb71-48d9a6f8b383" />

<img width="678" height="159" alt="image" src="https://github.com/user-attachments/assets/797390e6-96c1-46ff-89bb-305bbe17008b" />

Here is the detailed Markdown for the **Machine Learning & MLOps Layer**.

I have synthesized the code snippets based on the standard **Spark MLlib** logic you implemented (predicting velocity) and the architecture diagram which clearly shows the separation of "Model Train" and "Model Inference".

---


### 3. Machine Learning & MLOps Strategy

To move beyond simple tracking, AeroStream employs a **Physics-Aware Machine Learning Strategy**. We treat flight efficiency as a regression problem: given the altitude and weather conditions, what *should* the plane's velocity be?

We implemented a **Decoupled MLOps Architecture** to ensure scalability:

#### **Pipeline A: The "Teacher" (Model Training)**
* **Schedule:** Weekly
* **Objective:** Retrain the model on the full historical dataset to learn updated flight physics.
* **Algorithm:** Linear Regression (Spark MLlib).
* **Target Variable:** `velocity` (Ground Speed).
* **Features:** `baro_altitude`, `temperature_c`, `wind_speed_kmh`, `wind_offset_angle`.

```python
# Notebook: 04_ML_training.ipynb
from pyspark.ml.feature import VectorAssembler
from pyspark.ml.regression import LinearRegression
from pyspark.ml import Pipeline

# 1. Feature Engineering
assembler = VectorAssembler(
    inputCols=["baro_altitude", "temperature_c", "wind_speed_kmh", "wind_offset_angle"],
    outputCol="features",
    handleInvalid="skip"
)

# 2. Define the Model
lr = LinearRegression(featuresCol="features", labelCol="velocity")

# 3. Build & Train Pipeline
pipeline = Pipeline(stages=[assembler, lr])
model = pipeline.fit(train_df)

# 4. Save Artifact to Data Lake (Overwriting the 'Production' model)
model.write().overwrite().save("abfss://models@aerostream.dfs.core.windows.net/flight_velocity_model_v1")

```

#### **Pipeline B: The "Worker" (Model Inference)**

* **Schedule:** Hourly (Triggered by ADF)
* **Objective:** Score only the *new* incoming flight data using the saved model artifact.
* **Output:** Generates two critical metrics:
* `predicted_velocity`: The theoretical speed the plane *should* be flying.
* `efficiency_score`: The ratio of `(Actual / Predicted) * 100`.



```python
# Notebook: 05_ML_Inference.ipynb
from pyspark.ml import PipelineModel
from pyspark.sql.functions import col, when

# 1. Load the Pre-Trained Model
model = PipelineModel.load("abfss://models@aerostream.dfs.core.windows.net/flight_velocity_model_v1")

# 2. Run Inference (Score the Batch)
predictions = model.transform(current_batch_df)

# 3. Calculate Business Metrics (Efficiency)
final_df = predictions.withColumn(
    "efficiency_score", 
    (col("velocity") / col("prediction")) * 100
).withColumn(
    "status",
    when(col("efficiency_score") < 80, "Inefficient")
    .when(col("efficiency_score") > 105, "High Performance")
    .otherwise("Optimal")
)

# 4. Write to Presentation Layer
final_df.write.format("delta").mode("append").saveAsTable("presentation.flight_predictions")

```

#### **Why this Architecture?**

By decoupling training and inference, we achieve:

* **Cost Efficiency:** Expensive training (on terabytes of history) happens only once a week.
* **Latency:** Hourly pipelines are lightweight because they only *load* the model, they don't *build* it.
* **Consistency:** The same model version is applied to all flights until the next scheduled update.




<img width="5000" height="3000" alt="diagram-export-1-19-2026-1_13_27-AM" src="https://github.com/user-attachments/assets/54429262-3136-4404-adeb-548f2bdbe309" />

---
## AeroStream Command Center (Web App)

<img width="1746" height="986" alt="image" src="https://github.com/user-attachments/assets/61acdc6c-9401-449d-9cbc-c188256354d7" />



The final layer of the stack is the **Operational Intelligence Console**. Built with **Vue.js 3**, this dashboard is not just a passive visualization; it is an active decision-support tool designed for airline analysts. It translates the raw math from our Spark models into immediate visual cues.


### **Key Interface Modules**

* **1. Global Map View (Geospatial Intelligence)**
    * **Tech:** Powered by **Leaflet.js** for rendering interactive, vector-based maps.
    * **Function:** Visualizes the real-time position of the entire fleet. Aircraft are color-coded based on the ML model's output—**Red** indicates "Critical Inefficiency" while **Green** indicates "Optimal Performance". This allows operators to assess fleet health at a glance.

* **2. Priority Monitoring List (Anomaly Detection)**
    * **Function:** Automatically ranks flights by their `efficiency_score`. The lowest-scoring flights (e.g., 21%, 37%) bubble to the top, demanding immediate attention.
    * **Logic:** This list is dynamically sorted by the backend query: `ORDER BY efficiency_score ASC`. It filters out noise, ensuring analysts focus only on problem aircraft.

* **3. System Properties (Drill-Down Telemetry)**
    * **Function:** When a specific flight is selected, this panel reveals the "Why".
    * **Data Fusion:** It combines data from two distinct sources into a single view:
        * **Positional Data:** Velocity, Altitude, Heading (from OpenSky).
        * **Environmental Sensors:** Wind Speed, Temperature, Fog/Mist conditions (from OpenMeteo).

* **4. Recommendation Engine**
    * **Function:** The bottom panel displays natural-language action items generated by the system logic.
    * **Example:** *"Velocity below physics model baseline. Check throttle."* or *"Request Flight Level (FL) change."*.

---

### **Technical Implementation**

To ensure security and performance, the frontend never speaks directly to the database. We utilize a **3-Tier Architecture**:

1.  **Frontend (Vue.js):**
    * Requests data via a secure REST API.
    * Uses reactive state management to update the UI instantly when new data arrives.
2.  **Backend (FastAPI):**
    * Acts as the secure gateway. It holds the **Databricks Personal Access Token (PAT)** in a secure environment variable (`.env`).
    * Executes optimized SQL queries against the **Databricks Serverless SQL Warehouse**.
3.  **Database (Databricks Gold Layer):**
    * Serves the `presentation.flight_predictions` table, ensuring the web app consumes pre-computed, high-quality data.

<img width="1744" height="981" alt="image" src="https://github.com/user-attachments/assets/4272cddb-d0ab-499d-beb4-2af96a41be44" />




---

## How to Run Locally

This project uses a **monorepo** structure. You will need two terminal windows open: one for the Backend (API) and one for the Frontend (UI).

### **Prerequisites**
* **Node.js** (v16+)
* **Python** (v3.9+)
* **Git**

### **1. Clone the Repository**
```bash
git clone [https://github.com/AvirukthGT/AeroStream.git](https://github.com/AvirukthGT/AeroStream.git)
cd AeroStream

```

### **2. Setup the Backend (FastAPI)**

The backend acts as a secure proxy to Databricks.

```bash
cd backend

# Create & Activate Virtual Environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt

# IMPORTANT: Configure Secrets
# Create a .env file in the /backend folder with your Databricks keys:
# DB_SERVER=adb-xxxx.net
# DB_PATH=/sql/1.0/warehouses/xxxx
# DB_TOKEN=dapi...

# Run the Server
uvicorn main:app --reload

```

*The API will be live at `http://localhost:8000/api/flights*`

### **3. Setup the Frontend (Vue.js)**

The frontend visualizes the API data. Open a **new terminal**:

```bash
cd frontend

# Install Libraries
npm install

# Run Development Server
npm run dev

```

*The App will be live at `http://localhost:5173*`



## Conclusion

**AeroStream** represents a shift from passive data tracking to active **Operational Intelligence**. By bridging the gap between raw telemetry and physics-based machine learning, this platform empowers aviation analysts to see not just *where* a plane is, but *how well* it is performing.

This project demonstrates the capacity to architect full-cycle data solutions—from ingestion and distributed processing on Azure Databricks to serving real-time insights via modern web applications.

### **👨‍💻 Connect with Me**

I am a Data Engineer passionate about building scalable Lakehouse architectures and MLOps pipelines.

* **LinkedIn:** [Avirukth Thadaklur](https://www.linkedin.com/in/avirukth-thadaklur)
* **GitHub:** [AvirukthGT](https://github.com/AvirukthGT)



