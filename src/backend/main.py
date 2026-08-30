from fastapi import FastAPI
from src.backend.routes.disease import router as disease_router

app = FastAPI(
    title="FarmSight API",
    description="Backend API for FarmSight",
    version="1.0.0",
)

app.include_router(disease_router)


@app.get("/")
def root():
    return {
        "status": "success",
        "message": "FarmSight backend is running."
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }