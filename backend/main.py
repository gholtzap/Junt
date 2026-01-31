from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import album, montage, websocket, library, playlist, cleanup
from services.cleanup import cleanup_service
from config.settings import settings
import os
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

os.makedirs(settings.TEMP_DIR, exist_ok=True)

app = FastAPI(
    title="Junt API",
    description="Find your favorite track without hitting skip. The fastest way to digest any new release.",
    version="1.0.0"
)


@app.on_event("startup")
async def startup_event():
    """Start background services on application startup."""
    if settings.CLEANUP_ENABLED:
        cleanup_service.start_periodic_cleanup(interval_minutes=settings.CLEANUP_INTERVAL_MINUTES)
        logging.info(f"Cleanup service started: interval={settings.CLEANUP_INTERVAL_MINUTES}min, max_age={settings.CLEANUP_MAX_AGE_HOURS}h")


@app.on_event("shutdown")
async def shutdown_event():
    """Stop background services on application shutdown."""
    if settings.CLEANUP_ENABLED:
        await cleanup_service.stop_periodic_cleanup()

origins = settings.ALLOWED_ORIGINS.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(album.router)
app.include_router(montage.router)
app.include_router(websocket.router)
app.include_router(library.router)
app.include_router(playlist.router)
app.include_router(cleanup.router)


@app.get("/")
async def root():
    return {
        "message": "Junt API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
