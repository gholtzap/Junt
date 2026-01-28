from fastapi import APIRouter, HTTPException
from typing import List
from api.schemas import (
    Playlist,
    PlaylistCreateRequest,
    PlaylistUpdateRequest,
    AddTrackToPlaylistRequest,
    AddJuntToPlaylistRequest,
    ReorderPlaylistRequest,
    PlaylistListResponse
)
from services import playlist

router = APIRouter(prefix="/api/playlists", tags=["playlists"])


@router.get("", response_model=PlaylistListResponse)
async def list_playlists():
    """Get all playlists."""
    try:
        playlists = playlist.get_playlists()
        return PlaylistListResponse(
            playlists=playlists,
            total=len(playlists)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get playlists: {str(e)}")


@router.post("", response_model=Playlist)
async def create_playlist(request: PlaylistCreateRequest):
    """Create a new playlist."""
    try:
        new_playlist = await playlist.create_playlist(
            name=request.name,
            description=request.description
        )
        return new_playlist
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create playlist: {str(e)}")


@router.get("/{playlist_id}", response_model=Playlist)
async def get_playlist(playlist_id: str):
    """Get a specific playlist."""
    try:
        playlist_data = await playlist.get_playlist(playlist_id)
        return playlist_data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get playlist: {str(e)}")


@router.patch("/{playlist_id}", response_model=Playlist)
async def update_playlist(playlist_id: str, request: PlaylistUpdateRequest):
    """Update a playlist's metadata."""
    try:
        updated_playlist = await playlist.update_playlist(
            playlist_id=playlist_id,
            name=request.name,
            description=request.description
        )
        return updated_playlist
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update playlist: {str(e)}")


@router.delete("/{playlist_id}")
async def delete_playlist(playlist_id: str):
    """Delete a playlist."""
    try:
        await playlist.delete_playlist(playlist_id)
        return {"message": "Playlist deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete playlist: {str(e)}")


@router.post("/{playlist_id}/items/track", response_model=Playlist)
async def add_track_to_playlist(playlist_id: str, request: AddTrackToPlaylistRequest):
    """Add a track to a playlist."""
    try:
        updated_playlist = await playlist.add_track_to_playlist(
            playlist_id=playlist_id,
            junt_id=request.junt_id,
            track_number=request.track_number
        )
        return updated_playlist
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add track: {str(e)}")


@router.post("/{playlist_id}/items/junt", response_model=Playlist)
async def add_junt_to_playlist(playlist_id: str, request: AddJuntToPlaylistRequest):
    """Add an entire junt to a playlist."""
    try:
        updated_playlist = await playlist.add_junt_to_playlist(
            playlist_id=playlist_id,
            junt_id=request.junt_id
        )
        return updated_playlist
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add junt: {str(e)}")


@router.delete("/{playlist_id}/items/{item_id}", response_model=Playlist)
async def remove_item_from_playlist(playlist_id: str, item_id: str):
    """Remove an item from a playlist."""
    try:
        updated_playlist = await playlist.remove_item_from_playlist(
            playlist_id=playlist_id,
            item_id=item_id
        )
        return updated_playlist
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove item: {str(e)}")


@router.put("/{playlist_id}/items/reorder", response_model=Playlist)
async def reorder_playlist_items(playlist_id: str, request: ReorderPlaylistRequest):
    """Reorder items in a playlist."""
    try:
        updated_playlist = await playlist.reorder_playlist_items(
            playlist_id=playlist_id,
            item_ids=request.item_ids
        )
        return updated_playlist
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reorder items: {str(e)}")


@router.get("/{playlist_id}/tracks")
async def get_playlist_tracks(playlist_id: str):
    """Get resolved tracks from a playlist for playback."""
    try:
        tracks = await playlist.resolve_playlist_tracks(playlist_id)
        return {"tracks": tracks}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resolve playlist tracks: {str(e)}")
