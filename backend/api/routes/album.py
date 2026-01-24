from fastapi import APIRouter, HTTPException, Query
from api.schemas import AlbumSearchResponse, AlbumDetail
from services.metadata import MetadataService

router = APIRouter(prefix="/api/album", tags=["album"])
metadata_service = MetadataService()


@router.get("/search", response_model=AlbumSearchResponse)
async def search_albums(q: str = Query(..., description="Search query")):
    """Search for albums by artist, title, or keywords."""
    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")

    albums = await metadata_service.search_albums(q)

    return AlbumSearchResponse(albums=albums)


@router.get("/{mbid}", response_model=AlbumDetail)
async def get_album_details(mbid: str):
    """Get full album details including tracklist."""
    album = await metadata_service.get_album_details(mbid)

    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    return album
