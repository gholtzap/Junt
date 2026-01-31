from fastapi import APIRouter, HTTPException
from services.cleanup import cleanup_service

router = APIRouter(prefix="/api/cleanup", tags=["cleanup"])


@router.post("/orphaned")
async def cleanup_orphaned():
    """Clean up orphaned temp files older than the configured age threshold."""
    try:
        result = await cleanup_service.cleanup_orphaned_files()
        return {
            "success": True,
            "message": f"Cleaned up {result['deleted_count']} orphaned files ({result['total_size_mb']}MB freed)",
            "details": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")


@router.post("/force")
async def force_cleanup_all():
    """
    Force cleanup of ALL temp files regardless of age.
    WARNING: This may delete files from active jobs.
    """
    try:
        result = await cleanup_service.force_cleanup_all()
        return {
            "success": True,
            "message": f"Force cleanup complete: {result['deleted_count']} files deleted ({result['total_size_mb']}MB freed)",
            "details": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Force cleanup failed: {str(e)}")


@router.get("/info")
async def get_temp_files_info():
    """Get information about current temp files."""
    try:
        info = cleanup_service.get_temp_files_info()
        return {
            "success": True,
            "data": info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get temp files info: {str(e)}")


@router.get("/status")
async def get_cleanup_status():
    """Get cleanup service status."""
    return {
        "success": True,
        "status": {
            "running": cleanup_service._running,
            "max_age_hours": cleanup_service.max_age_hours,
            "temp_dir": str(cleanup_service.temp_dir)
        }
    }
