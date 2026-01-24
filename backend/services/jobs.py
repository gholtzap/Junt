import asyncio
import uuid
from typing import Dict, Optional, Callable
from datetime import datetime
from api.schemas import JobStatus, TrackStatus, DurationType, AlbumDetail
from services.metadata import MetadataService
from services.downloader import DownloaderService
from services.analyzer import AnalyzerService
from services.processor import ProcessorService


class JobManager:
    def __init__(self):
        self.jobs: Dict[str, JobStatus] = {}
        self.callbacks: Dict[str, list] = {}  # WebSocket callbacks
        self.downloader = DownloaderService()
        self.analyzer = AnalyzerService()
        self.processor = ProcessorService()
        self.metadata = MetadataService()

    def create_job(self, mbid: str, duration: DurationType) -> str:
        """Create a new montage job."""
        job_id = str(uuid.uuid4())

        self.jobs[job_id] = JobStatus(
            status="queued",
            progress=0.0,
            current_track=None,
            total_tracks=0,
            completed_tracks=0,
            track_statuses=[],
            errors=[],
            file_path=None
        )

        self.callbacks[job_id] = []

        # Start processing in background
        asyncio.create_task(self._process_job(job_id, mbid, duration))

        return job_id

    def get_job_status(self, job_id: str) -> Optional[JobStatus]:
        """Get current job status."""
        return self.jobs.get(job_id)

    def register_callback(self, job_id: str, callback: Callable):
        """Register a WebSocket callback for job updates."""
        if job_id in self.callbacks:
            self.callbacks[job_id].append(callback)

    def unregister_callback(self, job_id: str, callback: Callable):
        """Unregister a WebSocket callback."""
        if job_id in self.callbacks:
            try:
                self.callbacks[job_id].remove(callback)
            except ValueError:
                pass

    async def _notify_callbacks(self, job_id: str, message_type: str, data: dict):
        """Notify all registered callbacks for a job."""
        if job_id in self.callbacks:
            for callback in self.callbacks[job_id]:
                try:
                    await callback({"type": message_type, "data": data})
                except Exception as e:
                    print(f"Error notifying callback: {e}")

    async def _process_job(self, job_id: str, mbid: str, duration: DurationType):
        """Process a montage creation job."""
        job = self.jobs[job_id]

        try:
            job.status = "processing"
            await self._notify_callbacks(job_id, "progress", {"status": "processing"})

            # Get album details
            album = await self.metadata.get_album_details(mbid)
            if not album:
                raise Exception("Failed to fetch album details")

            # Initialize track statuses
            job.total_tracks = len(album.tracks)
            job.track_statuses = [
                TrackStatus(
                    track_number=track.number,
                    track_title=track.title,
                    status="pending",
                    error=None
                )
                for track in album.tracks
            ]

            await self._notify_callbacks(job_id, "progress", {
                "total_tracks": job.total_tracks,
                "album": album.dict()
            })

            # Get clip duration settings
            clip_duration, crossfade_duration = self.processor.get_clip_duration(duration)

            # Progressive montage settings
            PARTIAL_READY_THRESHOLD = 3  # Start playback after this many tracks
            output_path = f"temp/{job_id}_montage.mp3"
            partial_ready_sent = False

            # Process each track
            clip_paths = []
            for i, track in enumerate(album.tracks):
                job.current_track = track.number
                track_status = job.track_statuses[i]

                try:
                    # Download track
                    track_status.status = "downloading"
                    await self._notify_callbacks(job_id, "progress", {
                        "current_track": track.number,
                        "track_status": track_status.dict()
                    })

                    output_filename = f"{job_id}_track_{track.number}"
                    audio_path = await self.downloader.download_track(
                        album.artist,
                        track.title,
                        output_filename
                    )

                    if not audio_path:
                        raise Exception("Failed to download track")

                    # Analyze for peak energy
                    track_status.status = "analyzing"
                    await self._notify_callbacks(job_id, "progress", {
                        "current_track": track.number,
                        "track_status": track_status.dict()
                    })

                    start_time, end_time = await self.analyzer.find_peak_energy_window(
                        audio_path,
                        clip_duration
                    )

                    # Extract clip
                    clip_path = f"temp/{job_id}_clip_{track.number}.mp3"
                    await self.processor.extract_clip(
                        audio_path,
                        start_time,
                        end_time,
                        clip_path
                    )

                    # Normalize
                    await self.processor.normalize_audio(clip_path)

                    clip_paths.append(clip_path)

                    # Mark as complete
                    track_status.status = "complete"
                    job.completed_tracks += 1
                    job.progress = job.completed_tracks / job.total_tracks

                    # Cleanup downloaded file
                    self.downloader.cleanup(audio_path)

                    await self._notify_callbacks(job_id, "track_complete", {
                        "track_number": track.number,
                        "track_title": track.title,
                        "completed": job.completed_tracks,
                        "total": job.total_tracks,
                        "progress": job.progress
                    })

                    # Progressive montage: Create/update montage after threshold reached
                    if len(clip_paths) >= PARTIAL_READY_THRESHOLD:
                        await self.processor.create_progressive_montage(
                            clip_paths,
                            output_path,
                            crossfade_duration
                        )

                        # Notify frontend that partial montage is ready for playback
                        if not partial_ready_sent:
                            job.file_path = output_path
                            await self._notify_callbacks(job_id, "partial_ready", {
                                "file_path": output_path,
                                "tracks_ready": len(clip_paths),
                                "total_tracks": job.total_tracks,
                                "message": f"First {len(clip_paths)} tracks ready! More tracks are being added..."
                            })
                            partial_ready_sent = True
                            print(f"Partial montage ready: {len(clip_paths)}/{job.total_tracks} tracks")

                except Exception as e:
                    error_msg = str(e)
                    track_status.status = "failed"
                    track_status.error = error_msg
                    job.errors.append(f"Track {track.number} ({track.title}): {error_msg}")

                    await self._notify_callbacks(job_id, "error", {
                        "track_number": track.number,
                        "error": error_msg
                    })

                    print(f"Error processing track {track.number}: {e}")

            # Check if we have any clips
            if not clip_paths:
                raise Exception("All tracks failed to process")

            # Create final montage (if we haven't created one yet, or to ensure final version)
            await self.processor.create_montage(
                clip_paths,
                output_path,
                crossfade_duration
            )

            # Cleanup individual clips
            self.processor.cleanup_clips(clip_paths)

            # Mark job as complete
            job.status = "completed"
            job.progress = 1.0
            job.file_path = output_path

            await self._notify_callbacks(job_id, "done", {
                "file_path": output_path,
                "total_tracks": job.completed_tracks,
                "errors": job.errors
            })

        except Exception as e:
            job.status = "failed"
            job.errors.append(f"Job failed: {str(e)}")

            await self._notify_callbacks(job_id, "error", {
                "message": str(e)
            })

            print(f"Job {job_id} failed: {e}")


# Global job manager instance
job_manager = JobManager()
