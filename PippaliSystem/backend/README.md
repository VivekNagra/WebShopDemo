# Pippali POS System - Backend

This is the backend for the Pippali POS system, built with FastAPI and PostgreSQL (SQLite for dev).

## Setup

1.  **Navigate to backend:**
    ```bash
    cd PippaliSystem/backend
    ```

2.  **Create Virtual Environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run Server:**
    ```bash
    uvicorn app.main:app --reload
    ```

## API Documentation

Once running, visit:
*   **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
*   **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Project Structure

*   `app/models`: Database models (SQLAlchemy)
*   `app/schemas`: Pydantic schemas (Validation)
*   `app/api`: API endpoints
*   `app/core`: Configuration
