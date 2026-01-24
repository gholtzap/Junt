import os
import shutil
from datetime import datetime
from bson import ObjectId
from config.database import get_database


async def save_montage(user_id: str, job_id: str, album: dict, duration_type: str) -> dict:
    """
    Save a completed montage to the user's library.
    Copies file from temp to permanent storage and creates database record.
    """
    db = get_database()

    # Generate montage ID
    montage_id = str(ObjectId())

    # Create user's montages directory if it doesn't exist
    user_dir = os.path.join("montages", user_id)
    os.makedirs(user_dir, exist_ok=True)

    # Copy file from temp to permanent storage
    temp_path = os.path.join("temp", f"{job_id}_montage.mp3")
    permanent_path = os.path.join(user_dir, f"{montage_id}.mp3")

    if not os.path.exists(temp_path):
        raise FileNotFoundError(f"Montage file not found: {temp_path}")

    shutil.copy2(temp_path, permanent_path)

    # Create database record
    montage_doc = {
        "_id": ObjectId(montage_id),
        "user_id": ObjectId(user_id),
        "file_path": permanent_path,
        "album": {
            "mbid": album["mbid"],
            "title": album["title"],
            "artist": album["artist"],
            "year": album.get("year"),
            "cover_url": album.get("cover_url")
        },
        "duration_type": duration_type,
        "track_count": len(album.get("tracks", [])),
        "created_at": datetime.utcnow()
    }

    await db.montages.insert_one(montage_doc)

    return montage_doc


async def get_user_montages(user_id: str, skip: int = 0, limit: int = 50) -> dict:
    """Get paginated list of user's saved montages."""
    db = get_database()

    # Query montages for this user
    cursor = db.montages.find(
        {"user_id": ObjectId(user_id)}
    ).sort("created_at", -1).skip(skip).limit(limit)

    montages = await cursor.to_list(length=limit)
    total = await db.montages.count_documents({"user_id": ObjectId(user_id)})

    return {
        "montages": montages,
        "total": total
    }


async def get_montage(montage_id: str) -> dict:
    """Get a single montage by ID."""
    db = get_database()

    montage = await db.montages.find_one({"_id": ObjectId(montage_id)})

    if not montage:
        raise ValueError("Montage not found")

    return montage


async def delete_montage(montage_id: str, user_id: str) -> bool:
    """Delete a montage from library and filesystem."""
    db = get_database()

    # Get montage to verify ownership and get file path
    montage = await db.montages.find_one({
        "_id": ObjectId(montage_id),
        "user_id": ObjectId(user_id)
    })

    if not montage:
        raise ValueError("Montage not found or unauthorized")

    # Delete file
    if os.path.exists(montage["file_path"]):
        os.remove(montage["file_path"])

    # Delete database record
    result = await db.montages.delete_one({
        "_id": ObjectId(montage_id),
        "user_id": ObjectId(user_id)
    })

    return result.deleted_count > 0
