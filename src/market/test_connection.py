import os
import sys
import logging

# Set up logging to stdout
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Fallback helper to load env variables from a local .env file
def load_dotenv_fallback(dotenv_path: str = ".env") -> None:
    if os.path.exists(dotenv_path):
        logger.info(f"Loading environment variables from {dotenv_path} (fallback mode)")
        with open(dotenv_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip("'\"")
                    os.environ[key] = val
    else:
        logger.warning(f"No {dotenv_path} file found.")

# Try to use python-dotenv, fallback if not installed
try:
    from dotenv import load_dotenv
    # Load dotenv from project root (2 levels up from src/market)
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    dotenv_file = os.path.join(project_root, ".env")
    if os.path.exists(dotenv_file):
        load_dotenv(dotenv_file)
        logger.info(f"Loaded environment variables from {dotenv_file} via python-dotenv")
    else:
        logger.warning(f"No .env file found at {dotenv_file}")
except ImportError:
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    dotenv_file = os.path.join(project_root, ".env")
    load_dotenv_fallback(dotenv_file)

# Ensure the parent directory 'src' is in the python path
src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

# Import the service
try:
    from market.market_service import MarketService
except ImportError:
    from market_service import MarketService

def run_test() -> None:
    service = MarketService()
    
    # Check if key is available
    if not service.api_key:
        print("\n[CONFIGURATION WARNING]")
        print("DATA_GOV_API_KEY is not configured in your environment or .env file.")
        print("To verify connection, please create a `.env` file in the project root containing:")
        print("DATA_GOV_API_KEY=your_actual_api_key")
        print("\nExiting test. (Connection verification requires a valid key).")
        return

    print("\nStarting data.gov.in API integration test...")
    print(f"API Base URL: {service.base_url}")
    
    # We will test fetching Cotton prices for Gujarat
    commodity = "Cotton"
    state = "Gujarat"
    
    try:
        records = service.get_market_prices(commodity=commodity, state=state, limit=5)
        print("\n[TEST RESULT: SUCCESS]")
        print(f"Successfully retrieved {len(records)} records for '{commodity}' in '{state}':")
        
        for idx, rec in enumerate(records, 1):
            print(f"\nRecord {idx}:")
            print(f"  Commodity:     {rec['commodity']}")
            print(f"  State:         {rec['state']}")
            print(f"  District:      {rec['district']}")
            print(f"  Market:        {rec['market']}")
            print(f"  Variety:       {rec['variety']}")
            print(f"  Min Price:     {rec['minimum_price']}")
            print(f"  Max Price:     {rec['maximum_price']}")
            print(f"  Modal Price:   {rec['modal_price']}")
            print(f"  Arrival Date:  {rec['arrival_date']}")
            
    except Exception as e:
        print("\n[TEST RESULT: FAILED]")
        print(f"An error occurred during API fetch: {e}")
        print("Please check your network connection, API key permissions, or query parameters.")

if __name__ == "__main__":
    run_test()
