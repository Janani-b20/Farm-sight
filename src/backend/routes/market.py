from typing import Optional

import requests
from fastapi import APIRouter, HTTPException, Query, status

from src.market.market_service import MarketService
from src.market.market_analyzer import MarketAnalyzer
from src.transport.transport_service import (
    TransportService,
    MandiNotFoundError,
)


router = APIRouter(
    prefix="/api",
    tags=["Market Intelligence"],
)


@router.get("/market", status_code=status.HTTP_200_OK)
def get_market_analysis(
    commodity: str = Query(...),
    state: str = Query(...),
    district: Optional[str] = Query(None),
    market: Optional[str] = Query(None),
    quantity_kg: Optional[float] = Query(None),
    user_lat: Optional[float] = Query(None),
    user_lng: Optional[float] = Query(None),
):
    service = MarketService()

    try:
        records = service.get_market_prices(
            commodity=commodity,
            state=state,
            district=district,
            market=market,
        )

        analyzer = MarketAnalyzer(records)

        return analyzer.analyze(
            quantity_kg=quantity_kg,
            user_lat=user_lat,
            user_lng=user_lng,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        )

    except requests.Timeout:
        raise HTTPException(
            status_code=504,
            detail="Market data service timed out.",
        )

    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Market data service unavailable: {str(exc)}",
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Market analysis failed: {str(exc)}",
        )


@router.get("/transport", status_code=status.HTTP_200_OK)
def get_transport_estimate(
    market_name: str = Query(...),
    district: str = Query(...),
    state: str = Query(...),
    user_lat: float = Query(...),
    user_lng: float = Query(...),
    quantity_kg: Optional[float] = Query(None),
):
    service = TransportService()

    try:
        return service.calculate_transport(
            market_name=market_name,
            district=district,
            state=state,
            user_lat=user_lat,
            user_lng=user_lng,
            quantity_kg=quantity_kg,
        )

    except MandiNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Transport calculation failed: {str(exc)}",
        )