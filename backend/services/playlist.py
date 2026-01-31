import uuid
from datetime import datetime
from typing import List, Dict, Optional
from services.library import read_library, write_library, get_montage


def get_playlists(page: int = 1, page_size: int = 50, skip: int = None, limit: int = None) -> dict:
    """Get paginated list of playlists."""
    library = read_library()
    playlists = library.get("playlists", [])

    playlists.sort(key=lambda x: x.get("updated_at", x.get("created_at", "")), reverse=True)

    total = len(playlists)

    if skip is not None and limit is not None:
        actual_skip = skip
        actual_limit = limit
        current_page = (skip // limit) + 1 if limit > 0 else 1
        current_page_size = limit
    else:
        current_page = max(1, page)
        current_page_size = max(1, page_size)
        actual_skip = (current_page - 1) * current_page_size
        actual_limit = current_page_size

    paginated_playlists = playlists[actual_skip:actual_skip + actual_limit]
    total_pages = (total + current_page_size - 1) // current_page_size if current_page_size > 0 else 0

    return {
        "playlists": paginated_playlists,
        "pagination": {
            "total": total,
            "page": current_page,
            "page_size": current_page_size,
            "total_pages": total_pages,
            "has_next": current_page < total_pages,
            "has_previous": current_page > 1
        }
    }


async def create_playlist(name: str, description: Optional[str] = None) -> Dict:
    """Create a new playlist."""
    playlist_id = str(uuid.uuid4())

    playlist = {
        "id": playlist_id,
        "name": name,
        "description": description,
        "items": [],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }

    library = read_library()
    if "playlists" not in library:
        library["playlists"] = []

    library["playlists"].append(playlist)
    write_library(library)

    return playlist


async def get_playlist(playlist_id: str) -> Dict:
    """Get a single playlist by ID."""
    library = read_library()
    playlists = library.get("playlists", [])

    for playlist in playlists:
        if playlist.get("id") == playlist_id:
            return playlist

    raise ValueError("Playlist not found")


async def update_playlist(
    playlist_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None
) -> Dict:
    """Update a playlist's metadata."""
    library = read_library()
    playlists = library.get("playlists", [])

    for i, playlist in enumerate(playlists):
        if playlist.get("id") == playlist_id:
            if name is not None:
                playlist["name"] = name
            if description is not None:
                playlist["description"] = description

            playlist["updated_at"] = datetime.utcnow().isoformat()
            library["playlists"][i] = playlist
            write_library(library)
            return playlist

    raise ValueError("Playlist not found")


async def delete_playlist(playlist_id: str) -> bool:
    """Delete a playlist."""
    library = read_library()
    playlists = library.get("playlists", [])

    # Filter out the playlist to delete
    updated_playlists = [p for p in playlists if p.get("id") != playlist_id]

    if len(updated_playlists) == len(playlists):
        raise ValueError("Playlist not found")

    library["playlists"] = updated_playlists
    write_library(library)

    return True


async def add_track_to_playlist(
    playlist_id: str,
    junt_id: str,
    track_number: int
) -> Dict:
    """Add a track to a playlist."""
    library = read_library()
    playlists = library.get("playlists", [])

    # Verify junt and track exist
    montage = await get_montage(junt_id)
    track_exists = any(t.get("number") == track_number for t in montage.get("tracks", []))
    if not track_exists:
        raise ValueError(f"Track {track_number} not found in junt {junt_id}")

    # Find playlist and add item
    for i, playlist in enumerate(playlists):
        if playlist.get("id") == playlist_id:
            item = {
                "id": str(uuid.uuid4()),
                "type": "track",
                "junt_id": junt_id,
                "track_number": track_number,
                "added_at": datetime.utcnow().isoformat()
            }

            playlist["items"].append(item)
            playlist["updated_at"] = datetime.utcnow().isoformat()
            library["playlists"][i] = playlist
            write_library(library)

            return playlist

    raise ValueError("Playlist not found")


async def add_junt_to_playlist(playlist_id: str, junt_id: str) -> Dict:
    """Add an entire junt to a playlist."""
    library = read_library()
    playlists = library.get("playlists", [])

    # Verify junt exists
    await get_montage(junt_id)

    # Find playlist and add item
    for i, playlist in enumerate(playlists):
        if playlist.get("id") == playlist_id:
            item = {
                "id": str(uuid.uuid4()),
                "type": "junt",
                "junt_id": junt_id,
                "added_at": datetime.utcnow().isoformat()
            }

            playlist["items"].append(item)
            playlist["updated_at"] = datetime.utcnow().isoformat()
            library["playlists"][i] = playlist
            write_library(library)

            return playlist

    raise ValueError("Playlist not found")


async def remove_item_from_playlist(playlist_id: str, item_id: str) -> Dict:
    """Remove an item from a playlist."""
    library = read_library()
    playlists = library.get("playlists", [])

    for i, playlist in enumerate(playlists):
        if playlist.get("id") == playlist_id:
            original_length = len(playlist["items"])
            playlist["items"] = [item for item in playlist["items"] if item.get("id") != item_id]

            if len(playlist["items"]) == original_length:
                raise ValueError("Item not found in playlist")

            playlist["updated_at"] = datetime.utcnow().isoformat()
            library["playlists"][i] = playlist
            write_library(library)

            return playlist

    raise ValueError("Playlist not found")


async def reorder_playlist_items(playlist_id: str, item_ids: List[str]) -> Dict:
    """Reorder items in a playlist."""
    library = read_library()
    playlists = library.get("playlists", [])

    for i, playlist in enumerate(playlists):
        if playlist.get("id") == playlist_id:
            # Build a map of item_id -> item
            items_map = {item.get("id"): item for item in playlist["items"]}

            # Verify all IDs are valid
            if set(item_ids) != set(items_map.keys()):
                raise ValueError("Invalid item IDs provided")

            # Reorder items
            playlist["items"] = [items_map[item_id] for item_id in item_ids]
            playlist["updated_at"] = datetime.utcnow().isoformat()
            library["playlists"][i] = playlist
            write_library(library)

            return playlist

    raise ValueError("Playlist not found")


async def resolve_playlist_tracks(playlist_id: str) -> List[Dict]:
    """
    Resolve playlist items to actual tracks with file paths.
    Returns a list of track objects ready for playback.
    """
    playlist = await get_playlist(playlist_id)
    resolved_tracks = []

    for item in playlist.get("items", []):
        junt_id = item.get("junt_id")

        try:
            montage = await get_montage(junt_id)

            if item.get("type") == "track":
                # Single track
                track_number = item.get("track_number")
                track = next(
                    (t for t in montage.get("tracks", []) if t.get("number") == track_number),
                    None
                )
                if track:
                    resolved_tracks.append({
                        "junt_id": junt_id,
                        "junt_title": montage["album"]["title"],
                        "junt_artist": montage["album"]["artist"],
                        "track_number": track["number"],
                        "track_title": track["title"],
                        "file_path": track["file_path"]
                    })
            elif item.get("type") == "junt":
                # All tracks from junt
                for track in montage.get("tracks", []):
                    resolved_tracks.append({
                        "junt_id": junt_id,
                        "junt_title": montage["album"]["title"],
                        "junt_artist": montage["album"]["artist"],
                        "track_number": track["number"],
                        "track_title": track["title"],
                        "file_path": track["file_path"]
                    })
        except ValueError:
            # Junt not found - skip this item
            continue

    return resolved_tracks
