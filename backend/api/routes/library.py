from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from api.schemas import MontageSaveRequest, SavedMontage, LibraryResponse
from services import library
import os

router = APIRouter(prefix="/api/library", tags=["library"])


@router.post("/save")
async def save_montage(request: dict):
    """Save a completed montage to library."""
    try:
        # Extract data from request
        job_id = request.get("job_id")
        album = request.get("album")
        duration_type = request.get("duration_type")
        tracks = request.get("tracks", [])

        montage_doc = await library.save_montage(
            job_id=job_id,
            album=album,
            duration_type=duration_type,
            tracks=tracks
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
            # Get tracks data
            tracks_data = montage.get("tracks", [])

            montages.append(SavedMontage(
                id=montage["id"],
                album={
                    "mbid": montage["album"]["mbid"],
                    "title": montage["album"]["title"],
                    "artist": montage["album"]["artist"],
                    "year": montage["album"].get("year"),
                    "cover_url": montage["album"].get("cover_url"),
                    "tracks": []  # Empty for album info, tracks are in montage.tracks
                },
                duration_type=montage["duration_type"],
                tracks=tracks_data,
                created_at=montage["created_at"]
            ))

        return LibraryResponse(
            montages=montages,
            total=result["total"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get library: {str(e)}")


@router.get("/{montage_id}/tracks/{track_number}/stream")
async def stream_track(montage_id: str, track_number: int):
    """Stream a specific track from a montage."""
    try:
        # Get track file path
        file_path = await library.get_track_file(montage_id, track_number)

        # Get montage for metadata
        montage = await library.get_montage(montage_id)

        # Find track title
        track_title = f"Track {track_number}"
        for track in montage.get("tracks", []):
            if track.get("number") == track_number:
                track_title = track.get("title", track_title)
                break

        return FileResponse(
            file_path,
            media_type="audio/mpeg",
            filename=f"{montage['album']['artist']} - {track_title}.mp3"
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stream track: {str(e)}")


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
