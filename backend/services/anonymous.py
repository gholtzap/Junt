import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Optional, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import Request


class AnonymousTracker:
    """
    Tracks anonymous user usage to prevent spam while allowing trial access.
    Uses multiple tracking methods:
    - IP address
    - Browser fingerprint (User-Agent + Accept headers hash)
    - Session ID (stored in localStorage and DB)
    """

    MAX_ANONYMOUS_MONTAGES = 1
    RATE_LIMIT_WINDOW_HOURS = 24

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.anonymous_usage

    def generate_fingerprint(self, request: Request) -> str:
        """
        Generate browser fingerprint from headers.
        Not perfect, but adds another layer of tracking.
        """
        user_agent = request.headers.get("user-agent", "")
        accept = request.headers.get("accept", "")
        accept_language = request.headers.get("accept-language", "")
        accept_encoding = request.headers.get("accept-encoding", "")

        # Create hash from header combination
        fingerprint_string = f"{user_agent}|{accept}|{accept_language}|{accept_encoding}"
        fingerprint_hash = hashlib.sha256(fingerprint_string.encode()).hexdigest()

        return fingerprint_hash

    def get_client_ip(self, request: Request) -> str:
        """
        Get client IP address, considering proxy headers.
        """
        # Check for proxy headers
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            # Take first IP if multiple
            return forwarded.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        # Fallback to direct client
        return request.client.host if request.client else "unknown"

    async def check_limit(
        self,
        request: Request,
        session_id: Optional[str] = None
    ) -> Tuple[bool, str, dict]:
        """
        Check if anonymous user has exceeded their limit.

        Returns:
            Tuple of (allowed: bool, session_id: str, usage_info: dict)
        """
        ip_address = self.get_client_ip(request)
        fingerprint = self.generate_fingerprint(request)

        # Generate session ID if not provided
        if not session_id:
            session_id = str(uuid.uuid4())

        # Look for existing usage records
        cutoff_time = datetime.utcnow() - timedelta(hours=self.RATE_LIMIT_WINDOW_HOURS)

        # Check by IP address (most reliable)
        ip_usage = await self.collection.find_one({
            "ip_address": ip_address,
            "last_created_at": {"$gte": cutoff_time}
        })

        # Check by fingerprint (secondary)
        fingerprint_usage = await self.collection.find_one({
            "fingerprint": fingerprint,
            "last_created_at": {"$gte": cutoff_time}
        })

        # Check by session ID (if user is trying to bypass with VPN)
        session_usage = None
        if session_id:
            session_usage = await self.collection.find_one({
                "session_id": session_id,
                "last_created_at": {"$gte": cutoff_time}
            })

        # Determine if limit exceeded
        # If any tracking method shows usage, count it
        usage_records = [r for r in [ip_usage, fingerprint_usage, session_usage] if r]

        if usage_records:
            # Get highest montage count from any tracking method
            max_count = max(r.get("montage_count", 0) for r in usage_records)

            usage_info = {
                "montage_count": max_count,
                "limit": self.MAX_ANONYMOUS_MONTAGES,
                "tracked_by": []
            }

            if ip_usage:
                usage_info["tracked_by"].append("ip")
            if fingerprint_usage:
                usage_info["tracked_by"].append("fingerprint")
            if session_usage:
                usage_info["tracked_by"].append("session")

            allowed = max_count < self.MAX_ANONYMOUS_MONTAGES
            return (allowed, session_id, usage_info)

        # No usage found - first time user
        return (True, session_id, {
            "montage_count": 0,
            "limit": self.MAX_ANONYMOUS_MONTAGES,
            "tracked_by": []
        })

    async def record_usage(self, request: Request, session_id: str) -> None:
        """
        Record that an anonymous user created a montage.
        Creates/updates multiple tracking records for redundancy.
        """
        ip_address = self.get_client_ip(request)
        fingerprint = self.generate_fingerprint(request)
        now = datetime.utcnow()

        # Update or create record for each tracking method
        tracking_methods = [
            {"ip_address": ip_address},
            {"fingerprint": fingerprint},
            {"session_id": session_id}
        ]

        for filter_dict in tracking_methods:
            await self.collection.update_one(
                filter_dict,
                {
                    "$set": {
                        "last_created_at": now,
                        "ip_address": ip_address,
                        "fingerprint": fingerprint,
                        "session_id": session_id
                    },
                    "$inc": {"montage_count": 1},
                    "$setOnInsert": {"created_at": now}
                },
                upsert=True
            )

    async def get_usage_info(
        self,
        request: Request,
        session_id: Optional[str] = None
    ) -> dict:
        """
        Get usage information for anonymous user without updating.
        """
        allowed, session_id, usage_info = await self.check_limit(request, session_id)

        return {
            "allowed": allowed,
            "session_id": session_id,
            "usage": usage_info,
            "is_anonymous": True
        }
