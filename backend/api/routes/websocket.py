from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.jobs import job_manager
import json

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/progress/{job_id}")
async def websocket_progress(websocket: WebSocket, job_id: str):
    """WebSocket endpoint for real-time job progress updates."""
    await websocket.accept()

    # Check if job exists
    if not job_manager.get_job_status(job_id):
        await websocket.send_json({
            "type": "error",
            "data": {"message": "Job not found"}
        })
        await websocket.close()
        return

    # Define callback function
    async def send_update(message: dict):
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Error sending WebSocket message: {e}")

    # Register callback
    job_manager.register_callback(job_id, send_update)

    # Send current status immediately
    status = job_manager.get_job_status(job_id)
    if status:
        await websocket.send_json({
            "type": "status",
            "data": status.dict()
        })

    try:
        # Keep connection alive and listen for client messages
        while True:
            # Wait for messages (ping/pong to keep alive)
            data = await websocket.receive_text()

            # Echo back if needed
            if data == "ping":
                await websocket.send_text("pong")

    except WebSocketDisconnect:
        print(f"WebSocket disconnected for job {job_id}")
    finally:
        # Unregister callback
        job_manager.unregister_callback(job_id, send_update)
