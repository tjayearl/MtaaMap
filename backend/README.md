# MtaaMap backend

FastAPI service for backend-driven map queries backed by PostgreSQL and PostGIS.

## Run locally

1. Create a PostgreSQL database with the PostGIS extension enabled.
2. Copy `.env.example` to `.env` and update the connection settings.
3. Create and activate a virtual environment, then install `requirements.txt`.
4. Run migrations: `alembic upgrade head`
5. Start the API: `uvicorn app.main:app --reload`

Interactive API documentation is available at `http://localhost:8000/docs`.

## Query example

`GET /points?layer=prices&lat=-1.2864&lng=36.8172&radius_km=2&filter=tomato`