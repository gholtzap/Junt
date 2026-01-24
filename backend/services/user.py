from typing import Optional
from bson import ObjectId
from config.database import get_database
from services.auth import get_password_hash, verify_password


async def create_user(email: str, username: str, password: str) -> dict:
    db = get_database()
    users_collection = db["users"]

    # Check if user already exists
    existing_user = await users_collection.find_one({"$or": [{"email": email}, {"username": username}]})
    if existing_user:
        return None

    # Create user document
    user_doc = {
        "email": email,
        "username": username,
        "hashed_password": get_password_hash(password),
    }

    result = await users_collection.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    return user_doc


async def get_user_by_email(email: str) -> Optional[dict]:
    db = get_database()
    users_collection = db["users"]
    return await users_collection.find_one({"email": email})


async def get_user_by_id(user_id: str) -> Optional[dict]:
    db = get_database()
    users_collection = db["users"]
    try:
        return await users_collection.find_one({"_id": ObjectId(user_id)})
    except:
        return None


async def authenticate_user(email: str, password: str) -> Optional[dict]:
    user = await get_user_by_email(email)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user
