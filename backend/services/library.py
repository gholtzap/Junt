import os
import json
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional


def get_library_dir() -> Path:
    """Get the ~/.junt directory path."""
    library_dir = Path.home() / ".junt"
    library_dir.mkdir(exist_ok=True)
    return library_dir


def get_montages_dir() -> Path:
    """Get the ~/.junt/montages directory path."""
    montages_dir = get_library_dir() / "montages"
    montages_dir.mkdir(exist_ok=True)
    return montages_dir


def get_library_file() -> Path:
    """Get the library.json file path."""
    return get_library_dir() / "library.json"


def read_library() -> Dict:
    """Read the library.json file."""
    library_file = get_library_file()

    if not library_file.exists():
        return {"montages": []}

    try:
        with open(library_file, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {"montages": []}


def write_library(library: Dict) -> None:
    """Write to the library.json file."""
    library_file = get_library_file()
    with open(library_file, 'w') as f:
        json.dump(library, f, indent=2)


async def save_montage(job_id: str, album: dict, duration_type: str, tracks: List[dict]) -> dict:
    """
    Save a completed montage to the library.
    The junt directory with track files should already exist at ~/.junt/montages/{job_id}/
    """
    # Use job_id as montage_id (since the directory is already created with job_id)
    montage_id = job_id

    # Get montages directory
    montages_dir = get_montages_dir()
    junt_dir = montages_dir / montage_id

    # Verify directory exists
    if not junt_dir.exists():
        raise FileNotFoundError(f"Junt directory not found: {junt_dir}")

    # Ensure all tracks have file_path set
    tracks_with_paths = []
    for track in tracks:
        track_copy = track.copy()
        # If file_path is not provided, construct it
        if not track_copy.get("file_path"):
            track_number = track_copy.get("number")
            if track_number:
                track_filename = f"track_{track_number:02d}.mp3"
                track_copy["file_path"] = str(junt_dir / track_filename)
        tracks_with_paths.append(track_copy)

    # Create montage record with track details
    montage_doc = {
        "id": montage_id,
        "album": {
            "mbid": album["mbid"],
            "title": album["title"],
            "artist": album["artist"],
            "year": album.get("year"),
            "cover_url": album.get("cover_url")
        },
        "duration_type": duration_type,
        "tracks": tracks_with_paths,  # Store full track details with file paths
        "created_at": datetime.utcnow().isoformat()
    }

    # Add to library
    library = read_library()
    library["montages"].append(montage_doc)
    write_library(library)

    return montage_doc


async def get_user_montages(page: int = 1, page_size: int = 50, skip: int = None, limit: int = None) -> dict:
    """Get paginated list of saved montages."""
    library = read_library()
    montages = library.get("montages", [])

    # Sort by created_at descending
    montages.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    total = len(montages)

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

    paginated_montages = montages[actual_skip:actual_skip + actual_limit]
    total_pages = (total + current_page_size - 1) // current_page_size if current_page_size > 0 else 0

    return {
        "montages": paginated_montages,
        "pagination": {
            "total": total,
            "page": current_page,
            "page_size": current_page_size,
            "total_pages": total_pages,
            "has_next": current_page < total_pages,
            "has_previous": current_page > 1
        }
    }


async def get_montage(montage_id: str) -> dict:
    """Get a single montage by ID."""
    library = read_library()
    montages = library.get("montages", [])

    for montage in montages:
        if montage.get("id") == montage_id:
            return montage

    raise ValueError("Montage not found")


async def delete_montage(montage_id: str) -> bool:
    """Delete a montage from library and filesystem."""
    library = read_library()
    montages = library.get("montages", [])

    # Find the montage
    montage_to_delete = None
    for montage in montages:
        if montage.get("id") == montage_id:
            montage_to_delete = montage
            break

    if not montage_to_delete:
        raise ValueError("Montage not found")

    # Delete junt folder with all track files
    montages_dir = get_montages_dir()
    junt_dir = montages_dir / montage_id
    if junt_dir.exists():
        shutil.rmtree(junt_dir)

    # Remove from library
    library["montages"] = [m for m in montages if m.get("id") != montage_id]
    write_library(library)

    return True


async def get_track_file(montage_id: str, track_number: int) -> Optional[str]:
    """Get the file path for a specific track in a montage."""
    # Get the montage
    montage = await get_montage(montage_id)

    # Find the track
    tracks = montage.get("tracks", [])
    for track in tracks:
        if track.get("number") == track_number:
            file_path = track.get("file_path")
            if file_path and os.path.exists(file_path):
                return file_path
            raise FileNotFoundError(f"Track file not found: {file_path}")

    raise ValueError(f"Track {track_number} not found in montage {montage_id}")
