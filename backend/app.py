import os
import uvicorn
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from config import settings
from routes.endpoints import router as api_router
from services.db_service import init_db

# Configure structured logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("app")

app = FastAPI(
    title="CarbonCoach AI API",
    description="Enterprise-grade Backend API for AI-powered carbon tracking and reduction coaching",
    version="1.0.0",
)

# Set up CORS middleware to allow connection from Next.js frontend or Firebase Hosting domains
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    for o in env_origins.split(","):
        o_clean = o.strip()
        if o_clean and o_clean not in origins:
            origins.append(o_clean)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(api_router)


# Initialize storage and database schema on startup
@app.on_event("startup")
async def startup_event():
    logger.info("Initializing database storage...")
    init_db()
    logger.info("Startup complete. Server configured and ready.")


# Global exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Unhandled exception occurred on path {request.url.path}: {exc}", exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected server error occurred. Please try again later."
        },
    )


from services.db_service import DatabaseService

@app.get("/health")
async def health_check():
    """
    Startup and runtime health check verifying database responsiveness.
    """
    try:
        db = DatabaseService()
        # Query default points to test read path connectivity
        db.get_eco_points()
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "error": str(e)
            }
        )

@app.get("/")
async def root():
    return {"app": "CarbonCoach AI API", "status": "online", "documentation": "/docs"}


if __name__ == "__main__":
    # If starting via app.py directly, read environment variables for binding
    run_port = int(os.getenv("PORT", settings.PORT))
    run_host = os.getenv("HOST", settings.HOST)
    # Bind to 0.0.0.0 in production to accept external ingress
    if os.getenv("ENVIRONMENT") == "production":
        run_host = "0.0.0.0"
    uvicorn.run("app:app", host=run_host, port=run_port, reload=False if os.getenv("ENVIRONMENT") == "production" else True)
