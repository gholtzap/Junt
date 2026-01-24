from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import album, montage, websocket, auth, library
from config.database import connect_to_mongo, close_mongo_connection
import os

# Create temp and montages directories
os.makedirs("temp", exist_ok=True)
os.makedirs("montages", exist_ok=True)

app = FastAPI(
    title="Junt API",
    description="Find your favorite track without hitting skip. The fastest way to digest any new release.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database lifecycle
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()


# Include routers
app.include_router(auth.router)
app.include_router(album.router)
app.include_router(montage.router)
app.include_router(websocket.router)
app.include_router(library.router)


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
