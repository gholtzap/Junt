from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from api.schemas import MontageCreateRequest, MontageCreateResponse, JobStatus
from services.jobs import job_manager
from api.dependencies import get_current_user
import os

router = APIRouter(prefix="/api/montage", tags=["montage"])


@router.post("/create", response_model=MontageCreateResponse)
async def create_montage(
    request: MontageCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Start a new montage creation job."""
    job_id = job_manager.create_job(request.mbid, request.duration)

    return MontageCreateResponse(job_id=job_id)


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
