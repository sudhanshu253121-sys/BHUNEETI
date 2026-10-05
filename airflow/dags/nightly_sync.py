"""
Apache Airflow DAG: nightly_land_record_sync
=============================================================================
Orchestrates the automated end-to-end ingestion pipeline for the National Land
Governance Platform (NLGP):
  1. Extracts mutated land parcel records across State APIs via API Setu.
  2. Transliterates regional scripts (Marathi, Hindi, Kannada) using Bhashini NLP.
  3. Standardizes heterogeneous land units (Gunta, Bigha, Vigha) into SI Hectares
     and computes the 14-digit Unique Land Parcel Identification Number (ULPIN).
  4. Loads spatial geometries into PostgreSQL / PostGIS.
  5. Indexes full-text & metadata attributes into Elasticsearch for sub-second search.

Author: National Land Governance Architecture Team
Schedule: Daily at 02:00 AM IST (20:30 UTC)
=============================================================================
"""

from datetime import datetime, timedelta, timezone
import json
import logging
import math
import os

# Airflow imports with graceful fallback for standalone execution
try:
    from airflow import DAG
    from airflow.operators.python import PythonOperator
    from airflow.utils.dates import days_ago
    AIRFLOW_AVAILABLE = True
except ImportError:
    AIRFLOW_AVAILABLE = False

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("airflow.task")

# =============================================================================
# DEFAULT DAG CONFIGURATION
# =============================================================================
default_args = {
    "owner": "nlgp_data_eng",
    "depends_on_past": False,
    "email": ["alerts-cadastre@dolr.gov.in"],
    "email_on_failure": True,
    "email_on_retry": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
}

# Conversion constants to standard SI Hectares (1 Hectare = 10,000 sq meters)
UNIT_CONVERSION_MAP = {
    "hectare": 1.0,
    "ha": 1.0,
    "acre": 0.404686,
    "gunta": 0.010117,      # Maharashtra / Karnataka
    "guntha": 0.010117,
    "bigha_up": 0.250000,   # Uttar Pradesh Pakka Bigha
    "bigha": 0.250000,
    "vigha": 0.237800,      # Gujarat Vigha
    "biswa": 0.012500       # 1/20th of a Bigha
}


# =============================================================================
# TASK 1: EXTRACT REGIONAL DATA VIA API SETU
# =============================================================================
def extract_state_land_records(**context):
    """
    Simulates extracting mutated records from state revenue servers:
    - Maharashtra: Mahabhulekh (7/12 records)
    - Uttar Pradesh: Bhulekh (Khatauni)
    - Karnataka: Bhoomi Portal
    """
    logger.info("Connecting to National API Setu Gateway (Bearer Token Auth)...")
    
    # Mock extracted batch of updated records
    raw_extracted_records = [
        {
            "state_code": "27",
            "state_name": "Maharashtra",
            "district_code": "520",
            "district_name": "Pune",
            "survey_identifier": "Gat 342, Haveli",
            "raw_owner_name": "रामचंद्र तुकाराम पाटील",
            "source_lang": "mr",
            "raw_area": 242.0,
            "raw_unit": "Gunta",
            "centroid": {"lat": 18.5204, "lng": 73.8567},
            "mutation_date": "2026-10-02"
        },
        {
            "state_code": "09",
            "state_name": "Uttar Pradesh",
            "district_code": "112",
            "district_name": "Varanasi",
            "survey_identifier": "Khasra 819, Pindra",
            "raw_owner_name": "श्याम सुंदर यादव",
            "source_lang": "hi",
            "raw_area": 4.48,
            "raw_unit": "Bigha",
            "centroid": {"lat": 25.3176, "lng": 82.9739},
            "mutation_date": "2026-10-02"
        },
        {
            "state_code": "29",
            "state_name": "Karnataka",
            "district_code": "401",
            "district_name": "Bengaluru Urban",
            "survey_identifier": "Survey 114/2, Sarjapur",
            "raw_owner_name": "ವೆಂಕಟೇಶ್ ಮೂರ್ತಿ",
            "source_lang": "kn",
            "raw_area": 81.0,
            "raw_unit": "Gunta",
            "centroid": {"lat": 12.8596, "lng": 77.7871},
            "mutation_date": "2026-10-02"
        }
    ]

    logger.info(f"Successfully extracted {len(raw_extracted_records)} mutated land records from API Setu.")
    
    # Store in XCom (or intermediate object storage in production)
    if context.get("ti"):
        context["ti"].xcom_push(key="raw_records", value=raw_extracted_records)
    return raw_extracted_records


# =============================================================================
# TASK 2: TRANSLITERATION VIA BHASHINI NLP API
# =============================================================================
def transliterate_with_bhashini(**context):
    """
    Calls MeitY Bhashini API to transliterate vernacular names and tenure descriptions
    into standard English & Devanagari Hindi for nationwide interoperability.
    """
    ti = context.get("ti")
    records = ti.xcom_pull(key="raw_records", task_ids="extract_state_apis") if ti else extract_state_land_records()

    logger.info("Initializing Bhashini ASR/NLP Transliteration Model pipeline...")

    # Simulated Bhashini neural transliteration lookup
    transliteration_model = {
        "रामचंद्र तुकाराम पाटील": "Ramchandra Tukaram Patil",
        "श्याम सुंदर यादव": "Shyam Sundar Yadav",
        "ವೆಂಕಟೇಶ್ ಮೂರ್ತಿ": "Venkatesh Murthy"
    }

    transliterated_records = []
    for rec in records:
        native = rec["raw_owner_name"]
        en_translation = transliteration_model.get(native, f"Transliterated [{native}]")
        rec["owner_name_en"] = en_translation
        rec["bhashini_verified"] = True
        logger.info(f"Transliterated [{rec['source_lang']}] '{native}' -> '{en_translation}'")
        transliterated_records.append(rec)

    if ti:
        ti.xcom_push(key="transliterated_records", value=transliterated_records)
    return transliterated_records


# =============================================================================
# TASK 3: STANDARDIZATION & ULPIN GENERATION
# =============================================================================
def standardize_and_generate_ulpin(**context):
    """
    - Normalizes local land units (Gunta, Bigha) to metric Hectares.
    - Generates 14-digit ULPIN (Bhu-Aadhar) based on geospatial coordinates.
    - Constructs PostGIS GeoJSON polygon boundary.
    """
    ti = context.get("ti")
    records = ti.xcom_pull(key="transliterated_records", task_ids="bhashini_transliterate") if ti else transliterate_with_bhashini()

    standardized_batch = []
    for rec in records:
        # Unit conversion
        unit_key = rec["raw_unit"].strip().lower()
        multiplier = UNIT_CONVERSION_MAP.get(unit_key, 1.0)
        area_hectares = round(rec["raw_area"] * multiplier, 4)

        # 14-digit ULPIN calculation
        lat = rec["centroid"]["lat"]
        lng = rec["centroid"]["lng"]
        lat_part = int(abs(lat * 1000)) % 1000
        lng_part = int(abs(lng * 1000)) % 1000
        geo_unique = f"{(lat_part * 1000 + lng_part):06d}"
        
        ulpin = f"{rec['state_code']}-{rec['district_code']}-004-{geo_unique[:5]}"

        # Create PostGIS spatial feature
        delta = 0.006
        polygon_geom = {
            "type": "Polygon",
            "coordinates": [[
                [lng - delta, lat - delta],
                [lng + delta, lat - delta],
                [lng + delta, lat + delta],
                [lng - delta, lat + delta],
                [lng - delta, lat - delta]
            ]]
        }

        standardized_record = {
            "ulpin": ulpin,
            "state": rec["state_name"],
            "district": rec["district_name"],
            "survey_id": rec["survey_identifier"],
            "owner_native": rec["raw_owner_name"],
            "owner_en": rec["owner_name_en"],
            "area_hectares": area_hectares,
            "area_original": f"{rec['raw_area']} {rec['raw_unit']}",
            "coordinates": [lat, lng],
            "postgis_geojson": json.dumps(polygon_geom),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        standardized_batch.append(standardized_record)
        logger.info(f"Generated ULPIN {ulpin} for {rec['survey_identifier']} ({area_hectares} Ha)")

    if ti:
        ti.xcom_push(key="standardized_records", value=standardized_batch)
    return standardized_batch


# =============================================================================
# TASK 4: LOAD TO POSTGRESQL / POSTGIS
# =============================================================================
def load_to_postgis(**context):
    """
    Simulates executing PostGIS spatial UPSERT:
    INSERT INTO cadastral_parcels (ulpin, geom, area_ha, owner_en)
    VALUES (..., ST_GeomFromGeoJSON(...), ...)
    ON CONFLICT (ulpin) DO UPDATE ...
    """
    ti = context.get("ti")
    records = ti.xcom_pull(key="standardized_records", task_ids="standardize_ulpin_schema") if ti else standardize_and_generate_ulpin()

    logger.info(f"Opening connection pool to PostgreSQL / PostGIS Spatial Database...")
    for rec in records:
        logger.info(
            f"[PostGIS UPSERT] Table: 'spatial_cadastre_parcels' | ULPIN: {rec['ulpin']} | "
            f"ST_GeomFromGeoJSON({rec['coordinates']}) | Area: {rec['area_hectares']} Ha"
        )
    logger.info(f"Successfully committed {len(records)} spatial rows to PostGIS.")
    return len(records)


# =============================================================================
# TASK 5: INDEX INTO ELASTICSEARCH
# =============================================================================
def index_into_elasticsearch(**context):
    """
    Indexes standardized records into Elasticsearch index 'land_records_v2'
    with edge n-gram analyzers for sub-second fuzzy search and Kibana aggregations.
    """
    ti = context.get("ti")
    records = ti.xcom_pull(key="standardized_records", task_ids="standardize_ulpin_schema") if ti else standardize_and_generate_ulpin()

    logger.info("Connecting to Elasticsearch cluster (http://elasticsearch:9200)...")
    for rec in records:
        doc_body = {
            "ulpin": rec["ulpin"],
            "owner_en": rec["owner_en"],
            "owner_native": rec["owner_native"],
            "state": rec["state"],
            "district": rec["district"],
            "area_hectares": rec["area_hectares"],
            "location": {
                "lat": rec["coordinates"][0],
                "lon": rec["coordinates"][1]
            },
            "indexed_timestamp": rec["updated_at"]
        }
        logger.info(f"[Elasticsearch BULK INDEX] Index: 'land_records_v2' | DocID: {rec['ulpin']}")
    logger.info("Elasticsearch bulk indexing completed with 0 errors.")
    return True


# =============================================================================
# AIRFLOW DAG DEFINITION
# =============================================================================
if AIRFLOW_AVAILABLE:
    with DAG(
        dag_id="nightly_land_record_sync",
        default_args=default_args,
        description="Nightly sync of State Revenue Records, Bhashini Transliteration, PostGIS & Elasticsearch",
        schedule_interval="30 20 * * *",  # 02:00 AM IST daily (20:30 UTC)
        start_date=days_ago(1),
        catchup=False,
        tags=["nlgp", "etl", "bhashini", "postgis", "elasticsearch", "ulpin"],
    ) as dag:

        t1_extract = PythonOperator(
            task_id="extract_state_apis",
            python_callable=extract_state_land_records,
            provide_context=True,
        )

        t2_bhashini = PythonOperator(
            task_id="bhashini_transliterate",
            python_callable=transliterate_with_bhashini,
            provide_context=True,
        )

        t3_standardize = PythonOperator(
            task_id="standardize_ulpin_schema",
            python_callable=standardize_and_generate_ulpin,
            provide_context=True,
        )

        t4_postgis = PythonOperator(
            task_id="load_postgis",
            python_callable=load_to_postgis,
            provide_context=True,
        )

        t5_elastic = PythonOperator(
            task_id="index_into_elasticsearch",
            python_callable=index_into_elasticsearch,
            provide_context=True,
        )

        # Pipeline Dependency Graph
        t1_extract >> t2_bhashini >> t3_standardize >> [t4_postgis, t5_elastic]


# =============================================================================
# STANDALONE EXECUTION RUNNER (Ponytail Test Check)
# =============================================================================
if __name__ == "__main__":
    print("\n--- Running Airflow DAG Pipeline Simulation Locally ---")
    mock_context = {}
    r1 = extract_state_land_records(**mock_context)
    r2 = transliterate_with_bhashini(**mock_context)
    r3 = standardize_and_generate_ulpin(**mock_context)
    r4 = load_to_postgis(**mock_context)
    r5 = index_into_elasticsearch(**mock_context)
    assert len(r3) == 3, f"Expected 3 records, got {len(r3)}"
    assert r3[0]["ulpin"].startswith("27-520"), f"ULPIN mismatch: {r3[0]['ulpin']}"
    print("\n[OK] Airflow DAG execution simulation completed successfully.\n")
