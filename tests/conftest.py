import os
import sys
import pytest

# Add backend directory to Python path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from services.db_service import DatabaseService

@pytest.fixture(autouse=True)
def clean_db():
    """
    Cleans/resets the database state before each test.
    """
    db = DatabaseService()
    db.reset_db()
    yield
    db.reset_db()
