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


async def save_montage(job_id: str, album: dict, duration_type: str) -> dict:
    """
    Save a completed montage to the library.
    Copies file from temp to permanent storage and creates library record.
    """
    # Generate montage ID
    montage_id = str(uuid.uuid4())

    # Get montages directory
    montages_dir = get_montages_dir()

    # Copy file from temp to permanent storage
    temp_path = os.path.join("temp", f"{job_id}_montage.mp3")
    permanent_path = montages_dir / f"{montage_id}.mp3"

    if not os.path.exists(temp_path):
        raise FileNotFoundError(f"Montage file not found: {temp_path}")

    shutil.copy2(temp_path, permanent_path)

    # Create montage record
    montage_doc = {
        "id": montage_id,
        "file_path": str(permanent_path),
        "album": {
            "mbid": album["mbid"],
            "title": album["title"],
            "artist": album["artist"],
            "year": album.get("year"),
            "cover_url": album.get("cover_url")
        },
        "duration_type": duration_type,
        "track_count": len(album.get("tracks", [])),
        "created_at": datetime.utcnow().isoformat()
    }

    # Add to library
    library = read_library()
    library["montages"].append(montage_doc)
    write_library(library)

    return montage_doc


async def get_user_montages(skip: int = 0, limit: int = 50) -> dict:
    """Get paginated list of saved montages."""
    library = read_library()
    montages = library.get("montages", [])

    # Sort by created_at descending
    montages.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    # Paginate
    total = len(montages)
    paginated_montages = montages[skip:skip + limit]

    return {
        "montages": paginated_montages,
        "total": total
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

    # Delete file
    file_path = montage_to_delete.get("file_path")
    if file_path and os.path.exists(file_path):
        os.remove(file_path)

    # Remove from library
    library["montages"] = [m for m in montages if m.get("id") != montage_id]
    write_library(library)

    return True
