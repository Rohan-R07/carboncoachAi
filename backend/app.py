import uvicorn
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


# Set up CORS middleware to allow connection from Next.js frontend
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

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


@app.get("/")
async def root():
    return {"app": "CarbonCoach AI API", "status": "online", "documentation": "/docs"}


if __name__ == "__main__":
    uvicorn.run("app:app", host=settings.HOST, port=settings.PORT, reload=True)
