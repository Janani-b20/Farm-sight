# MarketSense Module

The MarketSense module provides daily price and arrival information for agricultural crops from various markets (Mandis) across India.

## Data Source
This module integrates with the official Indian Government open data API from **data.gov.in**:
- **Dataset:** "Current Daily Price of Various Commodities from Various Markets (Mandi)" (AGMARKNET data)
- **Resource ID:** `9ef84268-d588-465a-a308-a864a43d0070`
- **Base Endpoint:** `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070`

---

## Setup & Environment Configuration

To query data, you need to register on [data.gov.in](https://data.gov.in) and generate an API key.

1. Create a `.env` file in the project root based on `.env.example`:
   ```env
   DATA_GOV_API_KEY=your_actual_api_key_here
   DATA_GOV_RESOURCE_ID=9ef84268-d588-465a-a308-a864a43d0070
   ```

2. Make sure the virtual environment is set up and dependencies are installed:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate   # On Windows
   source .venv/bin/activate # On Unix/macOS
   pip install -r requirements.txt
   ```

---

## API Usage

Import and initialize the `MarketService` class, then invoke `get_market_prices`.

### Example Query
```python
import os
from market.market_service import MarketService

# Initialize the service
service = MarketService()

# Fetch daily Paddy prices in Punjab
records = service.get_market_prices(
    commodity="Paddy",
    state="Punjab",
    district="Amritsar", # Optional
    market="Rayya",      # Optional
    limit=5
)
```

### Supported Crops
The module initially supports case-insensitive normalized input for:
- **Paddy** (mapped to the API's `Paddy(Dhan)`)
- **Cotton** (mapped to the API's `Cotton`)
- **Groundnut** (mapped to the API's `Groundnut`)

*Note: For other commodities, the service will fall back to using a capitalized representation of the input string.*

---

## Example Request and Response

### Request
```text
GET https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=YOUR_API_KEY&format=json&limit=1&filters[state]=Gujarat&filters[commodity]=Cotton
```

### Response (Cleaned & Structured Output)
The service returns a list of dictionaries with clean structured types:
```json
[
  {
    "commodity": "Cotton",
    "state": "Gujarat",
    "district": "Amreli",
    "market": "Damnagar",
    "variety": "Other",
    "minimum_price": 6000.0,
    "maximum_price": 7500.0,
    "modal_price": 7000.0,
    "arrival_date": "27/08/2026"
  }
]
```

### Error & Exception Handling
The service includes robust handlers for:
- Missing configuration variables (`ValueError` if the API key is not present).
- Request timeouts (configured at 10 seconds).
- HTTP errors and connection failures (`requests.RequestException`).
- Empty response handling (returns an empty list `[]` gracefully).
