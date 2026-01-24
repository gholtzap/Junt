from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request, Header
from fastapi.responses import FileResponse
from api.schemas import MontageCreateRequest, MontageCreateResponse, JobStatus
from services.jobs import job_manager
from api.dependencies import get_current_user_optional
from services.anonymous import AnonymousTracker
from config.database import get_database
import os

router = APIRouter(prefix="/api/montage", tags=["montage"])


@router.get("/anonymous-status")
async def get_anonymous_status(
    request: Request,
    session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    """Check anonymous user limits before creating a montage."""
    db = get_database()
    tracker = AnonymousTracker(db)

    usage_info = await tracker.get_usage_info(request, session_id)

    return usage_info


@router.post("/create", response_model=MontageCreateResponse)
async def create_montage(
    montage_request: MontageCreateRequest,
    request: Request,
    current_user: Optional[dict] = Depends(get_current_user_optional),
    session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    """
    Start a new montage creation job.

    Authenticated users: Unlimited montages
    Anonymous users: 1 montage per 24 hours (tracked by IP, fingerprint, and session)
    """
    # If user is authenticated, allow unlimited creation
    if current_user:
        job_id = job_manager.create_job(montage_request.mbid, montage_request.duration)
        return MontageCreateResponse(job_id=job_id)

    # Anonymous user - check limits
    db = get_database()
    tracker = AnonymousTracker(db)

    allowed, session_id, usage_info = await tracker.check_limit(request, session_id)

    if not allowed:
        raise HTTPException(
            status_code=429,
            detail={
                "message": "Anonymous limit reached. Sign up to create unlimited montages!",
                "usage": usage_info,
                "session_id": session_id
            }
        )

    # Create the job
    job_id = job_manager.create_job(montage_request.mbid, montage_request.duration)

    # Record anonymous usage
    await tracker.record_usage(request, session_id)

    return MontageCreateResponse(
        job_id=job_id,
        session_id=session_id,
        is_anonymous=True,
        usage_info=usage_info
    )


@router.get("/{job_id}/status", response_model=JobStatus)
async def get_job_status(job_id: str):
    """Get the current status of a montage job."""
    status = job_manager.get_job_status(job_id)

    if not status:
        raise HTTPException(status_code=404, detail="Job not found")

    return status


@router.get("/{job_id}/download")
async def download_montage(job_id: str):
    """Download the completed montage file."""
    status = job_manager.get_job_status(job_id)

    if not status:
        raise HTTPException(status_code=404, detail="Job not found")

    if status.status != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")

    if not status.file_path or not os.path.exists(status.file_path):
        raise HTTPException(status_code=404, detail="Montage file not found")

    return FileResponse(
        status.file_path,
        media_type="audio/mpeg",
        filename=f"montage_{job_id}.mp3"
    )
