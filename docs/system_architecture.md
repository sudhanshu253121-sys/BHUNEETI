# System Architecture

## 1. High-Level Architecture Flow
The NLGP follows a scalable microservices architecture divided into distinct layers:

### A. Data Ingestion Layer (ETL)
*   **Tools:** Apache Airflow (DAG scheduling), API Setu, Apache Spark, Bhashini API.
*   **Process:** Automated cron jobs fetch raw data from state servers (JSON/XML). Spark transforms the schema, translates languages, and normalizes units.

### B. Storage Layer
*   **Relational DB:** PostgreSQL (Core land records, users, ULPIN mappings).
*   **Spatial DB:** PostGIS extension (Polygons, coordinates).
*   **NoSQL/Unstructured:** MongoDB (PDFs, research papers).
*   **Search/Analytics:** Elasticsearch (Inverted indexing for fast queries, Kibana integration).
*   **Cache:** Redis (API response caching).
*   **Vector DB:** Pinecone/Milvus (For LLM embedding storage).

### C. Logic & ML Layer (Backend)
*   **Framework:** Python with FastAPI.
*   **ML Models:** XGBoost (Tabular prediction saved as `.pkl`), CNN/U-Net (Satellite imagery processing).
*   **Services:** ULPIN verification service, predictive inference service.

### D. Presentation Layer (Frontend)
*   **Framework:** React.js / Next.js.
*   **Mapping:** Leaflet.js / Mapbox GL JS integrated with ISRO Bhuvan / Google Earth Engine APIs.
*   **Dashboards:** D3.js, Chart.js, Kibana embeds.

## 2. Infrastructure & Deployment
*   **Containerization:** Docker & Docker Compose for isolated microservices.
*   **Orchestration:** Kubernetes (planned for production scale).
*   **Hosting:** National Informatics Centre (NIC) Cloud / AWS.