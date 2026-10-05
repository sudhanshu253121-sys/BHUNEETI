# Project Rules & Guidelines

## 1. Coding Standards
*   **Backend:** Use Python 3.10+. Enforce asynchronous programming (`async def`) for all FastAPI routes. Use Pydantic models for strict request/response validation.
*   **Frontend:** Component-based architecture using React. Utilize Tailwind CSS for responsive styling.
*   **Data Science:** Serialize all trained ML models using `joblib`. Never train models during API inference; load `.pkl` files globally at server startup.

## 2. Data Handling & ETL Rules
*   **Language:** All regional text (Marathi, Hindi, etc.) MUST be transliterated to English/Hindi using the Bhashini API before database insertion.
*   **Measurements:** All land areas must be converted to standard Hectares in the PostgreSQL database.
*   **ULPIN:** Treat the 14-digit ULPIN as the primary unique identifier for all geospatial joins.

## 3. Security & Access
*   **Authentication:** Implement JWT-based Auth.
*   **RBAC:** Strictly enforce roles (Admin, State Official, Researcher, Public).
*   **Rate Limiting:** Protect all FastAPI endpoints to prevent DDoS or scraping of government APIs.

## 4. Deployment
*   All microservices must include a valid `Dockerfile` and `requirements.txt`/`package.json`.
*   Use `docker-compose` for local testing environments to ensure Redis, PostgreSQL, and FastAPI spin up simultaneously.