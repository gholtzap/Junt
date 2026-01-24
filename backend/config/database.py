import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = "album_previewer"

client = None
database = None


async def connect_to_mongo():
    global client, database
    try:
        if not MONGODB_URI:
            raise ValueError("MONGODB_URI environment variable is not set")
        client = AsyncIOMotorClient(MONGODB_URI)
        await client.admin.command('ping')
        database = client[DATABASE_NAME]
        print(f"Connected to MongoDB database: {DATABASE_NAME}")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("Closed MongoDB connection")


def get_database():
    if database is None:
        raise RuntimeError(
            "Database not initialized. Make sure MongoDB is running and MONGODB_URI is set correctly."
        )
    return database
