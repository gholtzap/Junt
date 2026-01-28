from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from api.schemas import MontageSaveRequest, SavedMontage, LibraryResponse
from services import library
import os

router = APIRouter(prefix="/api/library", tags=["library"])


@router.post("/save")
async def save_montage(request: MontageSaveRequest):
    """Save a completed montage to library."""
    try:
        montage_doc = await library.save_montage(
            job_id=request.job_id,
            album=request.album.dict(),
            duration_type=request.duration_type.value
        )

        return {
            "id": montage_doc["id"],
            "message": "Montage saved to library"
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save montage: {str(e)}")


@router.get("", response_model=LibraryResponse)
async def get_library(
    skip: int = 0,
    limit: int = 50
):
    """Get saved montages."""
    try:
        result = await library.get_user_montages(
            skip=skip,
            limit=limit
        )

        # Format montages for response
        montages = []
        for montage in result["montages"]:
            montages.append(SavedMontage(
                id=montage["id"],
                album={
                    "mbid": montage["album"]["mbid"],
                    "title": montage["album"]["title"],
                    "artist": montage["album"]["artist"],
                    "year": montage["album"].get("year"),
                    "cover_url": montage["album"].get("cover_url"),
                    "tracks": []  # Not needed for library display
                },
                duration_type=montage["duration_type"],
                track_count=montage["track_count"],
                created_at=montage["created_at"]
            ))

        return LibraryResponse(
            montages=montages,
            total=result["total"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get library: {str(e)}")


@router.get("/{montage_id}/stream")
async def stream_montage(montage_id: str):
    """Stream a saved montage."""
    try:
        # Get montage
        montage = await library.get_montage(montage_id)

        # Check if file exists
        if not os.path.exists(montage["file_path"]):
            raise HTTPException(status_code=404, detail="Montage file not found")

        return FileResponse(
            montage["file_path"],
            media_type="audio/mpeg",
            filename=f"{montage['album']['artist']} - {montage['album']['title']}.mp3"
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stream montage: {str(e)}")


@router.delete("/{montage_id}")
async def delete_montage(montage_id: str):
    """Delete a saved montage."""
    try:
        deleted = await library.delete_montage(montage_id=montage_id)

        if not deleted:
            raise HTTPException(status_code=404, detail="Montage not found")

        return {"message": "Montage deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete montage: {str(e)}")
