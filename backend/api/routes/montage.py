from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request, Header
from fastapi.responses import FileResponse
from api.schemas import MontageCreateRequest, MontageCreateResponse, JobStatus
from services.jobs import job_manager
from api.dependencies import get_current_user_optional
from services.anonymous import AnonymousTracker
from config.database import get_database
import os
import logging

logger = logging.getLogger(__name__)

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
    try:
        if current_user:
            job_id = job_manager.create_job(montage_request.mbid, montage_request.duration)
            return MontageCreateResponse(job_id=job_id)

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

        job_id = job_manager.create_job(montage_request.mbid, montage_request.duration)

        await tracker.record_usage(request, session_id)

        return MontageCreateResponse(
            job_id=job_id,
            session_id=session_id,
            is_anonymous=True,
            usage_info=usage_info
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating montage: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create montage: {str(e)}"
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
