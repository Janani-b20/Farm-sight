import os
import sys
import logging
from typing import Optional
from fastapi import FastAPI, Query, HTTPException, status
import requests

# Set up paths so we can import from src/market
src_dir = os.path.abspath(os.path.dirname(__file__))
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

try:
    from market.market_service import MarketService
    from market.market_analyzer import MarketAnalyzer
except ImportError:
    from market_service import MarketService
    from market_analyzer import MarketAnalyzer

try:
    from transport.transport_service import TransportService, MandiNotFoundError
except ImportError:
    from transport_service import TransportService, MandiNotFoundError

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="FarmSight API Backend",
    description="API services for FarmSight agricultural intelligence including MarketSense.",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "FarmSight API Backend",
        "version": "1.0.0"
    }

@app.get("/api/market", status_code=status.HTTP_200_OK)
def get_market_analysis(
    commodity: str = Query(..., description="Crop name (e.g. Paddy, Cotton, Groundnut)"),
    state: str = Query(..., description="State name (e.g. Punjab, Gujarat)"),
    district: Optional[str] = Query(None, description="Optional district name"),
    market: Optional[str] = Query(None, description="Optional wholesale market (Mandi) name"),
    quantity_kg: Optional[float] = Query(None, description="Optional quantity in kg to calculate gross estimated value"),
    user_lat: Optional[float] = Query(None, description="Optional farmer's latitude"),
    user_lng: Optional[float] = Query(None, description="Optional farmer's longitude"),
):
    """
    Exposes MarketSense crop analysis integrating MarketService and MarketAnalyzer.
    Fetches real-time prices from data.gov.in and performs data aggregation and analysis.
    """
    logger.info(f"Received market analysis request: commodity={commodity}, state={state}, district={district}, market={market}, quantity_kg={quantity_kg}, user_lat={user_lat}, user_lng={user_lng}")
    
    # Initialize service
    service = MarketService()
    
    try:
        # Fetch prices from service
        records = service.get_market_prices(
            commodity=commodity,
            state=state,
            district=district,
            market=market
        )
        
        # Analyze records
        analyzer = MarketAnalyzer(records)
        analysis_result = analyzer.analyze(
            quantity_kg=quantity_kg,
            user_lat=user_lat,
            user_lng=user_lng
        )
        
        return analysis_result

    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Configuration error: {str(e)}. Please contact the system administrator."
        )
    except requests.Timeout as e:
        logger.error(f"Timeout calling data.gov.in API: {e}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Timeout occurred while communicating with the data.gov.in API server. Please try again later."
        )
    except requests.HTTPError as e:
        logger.error(f"HTTP error calling data.gov.in API: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Bad Gateway: data.gov.in API returned HTTP error: {e.response.status_code if e.response else 'Unknown'}."
        )
    except requests.RequestException as e:
        logger.error(f"Network error calling data.gov.in API: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Bad Gateway: Failed to connect to the data.gov.in API: {str(e)}."
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected server error occurred: {str(e)}."
        )


# ---------------------------------------------------------------------------
# Transportation / Distance Estimation endpoint
# ---------------------------------------------------------------------------
@app.get("/api/transport", status_code=status.HTTP_200_OK)
def get_transport_estimate(
    market_name: str = Query(..., description="Name of the target mandi/market"),
    district: str = Query(..., description="District the mandi belongs to"),
    state: str = Query(..., description="State the mandi belongs to"),
    user_lat: float = Query(..., description="Farmer's latitude (decimal degrees)"),
    user_lng: float = Query(..., description="Farmer's longitude (decimal degrees)"),
    quantity_kg: Optional[float] = Query(None, description="Optional quantity in kg for cost estimation"),
):
    """
    Estimates transport distance and cost from the farmer's location to a
    specified mandi using the Haversine formula.

    Integration note
    ----------------
    `user_lat` and `user_lng` will eventually come from the live-location
    feature being developed by a teammate.  This endpoint is designed to
    accept those coordinates as explicit parameters so no coupling to any
    specific location implementation is required.
    """
    logger.info(
        f"Transport estimate request: market={market_name}, district={district}, "
        f"state={state}, user_lat={user_lat}, user_lng={user_lng}, quantity_kg={quantity_kg}"
    )

    transport_service = TransportService()

    try:
        result = transport_service.calculate_transport(
            market_name=market_name,
            district=district,
            state=state,
            user_lat=user_lat,
            user_lng=user_lng,
            quantity_kg=quantity_kg,
        )
        return result

    except MandiNotFoundError as e:
        logger.warning(f"Mandi not found: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Unexpected error in transport estimate: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected server error occurred: {str(e)}.",
        )
