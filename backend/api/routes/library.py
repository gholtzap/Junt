from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from api.schemas import MontageSaveRequest, SavedMontage, LibraryResponse
from api.dependencies import get_current_user
from services import library
from services.auth import decode_access_token
from services.user import get_user_by_id
import os

router = APIRouter(prefix="/api/library", tags=["library"])


@router.post("/save")
async def save_montage(
    request: MontageSaveRequest,
    current_user: dict = Depends(get_current_user)
):
    """Save a completed montage to user's library."""
    try:
        montage_doc = await library.save_montage(
            user_id=str(current_user["_id"]),
            job_id=request.job_id,
            album=request.album.dict(),
            duration_type=request.duration_type.value
        )

        return {
            "id": str(montage_doc["_id"]),
            "message": "Montage saved to library"
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save montage: {str(e)}")


@router.get("", response_model=LibraryResponse)
async def get_library(
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get user's saved montages."""
    try:
        result = await library.get_user_montages(
            user_id=str(current_user["_id"]),
            skip=skip,
            limit=limit
        )

        # Format montages for response
        montages = []
        for montage in result["montages"]:
            montages.append(SavedMontage(
                id=str(montage["_id"]),
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
                created_at=montage["created_at"].isoformat()
            ))

        return LibraryResponse(
            montages=montages,
            total=result["total"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get library: {str(e)}")


@router.get("/{montage_id}/stream")
async def stream_montage(
    montage_id: str,
    token: str = Query(None)
):
    """Stream a saved montage. Accepts token as query parameter for audio element compatibility."""
    try:
        # Authenticate using token from query parameter
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")

        payload = decode_access_token(token)
        if payload is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = await get_user_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")

        # Get montage and verify ownership
        montage = await library.get_montage(montage_id)

        if str(montage["user_id"]) != str(user["_id"]):
            raise HTTPException(status_code=403, detail="Unauthorized")

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
async def delete_montage(
    montage_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a saved montage."""
    try:
        deleted = await library.delete_montage(
            montage_id=montage_id,
            user_id=str(current_user["_id"])
        )

        if not deleted:
            raise HTTPException(status_code=404, detail="Montage not found")

        return {"message": "Montage deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete montage: {str(e)}")
