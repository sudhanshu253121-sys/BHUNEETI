# Project Context & Memory

## Core Concept
We are building the National Land Governance Platform (NLGP) to unify India's fragmented state-level land administration systems into a single, AI-driven digital ecosystem.

## Key Technical Decisions Made
*   **ULPIN (Bhu-Aadhar):** The system relies on the 14-digit coordinate-based ULPIN to uniquely identify land parcels and prevent inter-state duplication frauds.
*   **ETL is King:** Because states use different languages (Marathi for 7/12, Hindi for Khatauni) and units (Gunta vs. Hectare), a robust Apache Airflow pipeline doing extraction, Bhashini translation, and PostGIS loading is the backbone of the app.
*   **Search Architecture:** Standard SQL `JOIN`s are too slow for national scale. Elasticsearch with an inverted index will handle all frontend search queries and power the real-time Kibana dashboards.
*   **ML Strategy:** Urbanization predictions will use XGBoost for tabular data (historical records, distance to highways) and CNNs/U-Net for processing satellite imagery.
*   **Deployment:** The AI inference engines are wrapped in FastAPI and deployed via Docker alongside Redis for high-speed caching.

## Future Considerations
*   Need to secure API access using API Setu for live government data.
*   Explore Graph Neural Networks (GNNs) for modeling "contagion" effects of urbanization from one land parcel to its neighbors.