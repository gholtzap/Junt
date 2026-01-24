from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import album, montage, websocket, auth, library
from config.database import connect_to_mongo, close_mongo_connection
import os
import logging
from contextlib import asynccontextmanager

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

os.makedirs("temp", exist_ok=True)
os.makedirs("montages", exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(
    title="Junt API",
    description="Find your favorite track without hitting skip. The fastest way to digest any new release.",
    version="1.0.0",
    lifespan=lifespan
)

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
