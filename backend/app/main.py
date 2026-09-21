"""FastAPI Main Application Entrypoint.

AI-Powered Severity-Aware Multi-Label Content Moderation System Backend API.
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.config import settings
from app.database.database import init_db
from app.services.censor import censor_engine
from app.services.toxicity_model import toxicity_model

# Configure Structured Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("moderation.app")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for application startup and shutdown lifecycle."""
    logger.info("Starting up %s v%s...", settings.PROJECT_NAME, settings.VERSION)

    # 1. Initialize SQLite Database Tables
    try:
        init_db()
        logger.info("Database initialized successfully at %s", settings.DATABASE_URL)
    except Exception as exc:
        logger.error("Database initialization failed: %s", exc, exc_info=True)

    # 2. Load Censor Dictionary
    try:
        censor_engine.load_dictionary()
    except Exception as exc:
        logger.warning("Censor dictionary initialization warning: %s", exc)

    # 3. Pre-load Hugging Face Toxicity Classification Model
    try:
        toxicity_model.load_model()
    except Exception as exc:
        logger.error("Failed to load Hugging Face toxicity model on startup: %s", exc, exc_info=True)

    logger.info("Application startup sequence completed successfully.")
    yield
    logger.info("Application shutting down gracefully.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Production REST API for Severity-Aware Multi-Label Content Moderation. "
        "Evaluates comments against 6 independent toxicity categories, estimates severity, "
        "and applies policy-driven moderation decisions."
    ),
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if not settings.DEBUG else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle standard HTTP exceptions with structured response."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "status_code": exc.status_code,
            "detail": exc.detail,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle payload validation failures."""
    errors = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        msg = err.get("msg", "Validation error")
        errors.append(f"{loc}: {msg}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "status_code": 422,
            "detail": "Input validation error",
            "errors": errors,
        },
    )


@app.exception_handler(Exception)
async def global_unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled exceptions."""
    logger.error("Unhandled exception processing %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "status_code": 500,
            "detail": "An internal server error occurred while processing the request.",
        },
    )


# Root welcome endpoint
@app.get("/", tags=["System"], summary="Root API Information")
def root():
    """Returns basic API operational metadata and documentation links."""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "model_loaded": toxicity_model.is_loaded,
    }


# Register API Router
app.include_router(router)
