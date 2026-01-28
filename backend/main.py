from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import album, montage, websocket, library, playlist
import os
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

os.makedirs("temp", exist_ok=True)

app = FastAPI(
    title="Junt API",
    description="Find your favorite track without hitting skip. The fastest way to digest any new release.",
    version="1.0.0"
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
app.include_router(album.router)
app.include_router(montage.router)
app.include_router(websocket.router)
app.include_router(library.router)
app.include_router(playlist.router)


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
