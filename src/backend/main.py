from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from fastapi import FastAPI

from src.backend.routes.disease import router as disease_router
from src.backend.routes.market import router as market_router
from src.backend.routes.analysis import router as analysis_router
from src.backend.routes.whatif import router as whatif_router
from src.backend.routes.weather import router as weather_router


app = FastAPI(
    title="FarmSight API",
    description="Backend API for FarmSight",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(disease_router)
app.include_router(market_router)
app.include_router(analysis_router)
app.include_router(whatif_router)
app.include_router(weather_router)


@app.get("/")
def root():
    return {
        "status": "success",
        "message": "FarmSight backend is running.",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }