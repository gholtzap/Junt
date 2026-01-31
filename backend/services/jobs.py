import asyncio
import uuid
import shutil
import os
from pathlib import Path
from typing import Dict, Optional, Callable, Tuple
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

    async def _process_single_track(
        self,
        job_id: str,
        track: object,
        track_index: int,
        album: AlbumDetail,
        clip_percentage: float
    ) -> Tuple[int, Optional[str], Optional[str]]:
        """
        Process a single track: download, analyze, extract, and normalize.

        Returns:
            Tuple of (track_number, clip_path, error_message)
            If successful, error_message is None
        """
        job = self.jobs[job_id]
        track_status = job.track_statuses[track_index]

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

            # Calculate clip duration for this specific track
            clip_duration = self.processor.calculate_clip_duration(track.duration, clip_percentage)

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

            # Mark as complete
            track_status.status = "complete"

            # Cleanup downloaded file
            self.downloader.cleanup(audio_path)

            print(f"Track {track.number} processed successfully")
            return (track.number, clip_path, None)

        except Exception as e:
            error_msg = str(e)
            track_status.status = "failed"
            track_status.error = error_msg

            await self._notify_callbacks(job_id, "error", {
                "track_number": track.number,
                "error": error_msg
            })

            print(f"Error processing track {track.number}: {e}")
            return (track.number, None, error_msg)

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

            # Get clip percentage settings
            clip_percentage, _ = self.processor.get_clip_percentage(duration)

            # Processing settings
            BATCH_SIZE = 3  # Process this many tracks in parallel

            # Track clips by number to maintain order
            clips_by_track_number = {}

            # Process tracks in parallel batches
            for batch_start in range(0, len(album.tracks), BATCH_SIZE):
                batch_end = min(batch_start + BATCH_SIZE, len(album.tracks))
                batch_tracks = album.tracks[batch_start:batch_end]

                # Process this batch in parallel
                batch_tasks = [
                    self._process_single_track(
                        job_id,
                        track,
                        batch_start + i,
                        album,
                        clip_percentage
                    )
                    for i, track in enumerate(batch_tracks)
                ]

                # Wait for all tracks in this batch to complete
                batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)

                # Process results
                for result in batch_results:
                    if isinstance(result, Exception):
                        print(f"Batch task failed with exception: {result}")
                        continue

                    track_number, clip_path, error_msg = result

                    if error_msg:
                        # Error already logged in _process_single_track
                        job.errors.append(f"Track {track_number}: {error_msg}")
                    else:
                        # Successfully processed
                        clips_by_track_number[track_number] = clip_path
                        job.completed_tracks += 1
                        job.progress = job.completed_tracks / job.total_tracks

                        # Find track info for notification
                        track_info = next((t for t in album.tracks if t.number == track_number), None)

                        await self._notify_callbacks(job_id, "track_complete", {
                            "track_number": track_number,
                            "track_title": track_info.title if track_info else f"Track {track_number}",
                            "completed": job.completed_tracks,
                            "total": job.total_tracks,
                            "progress": job.progress
                        })

            # Check if we have any clips
            if not clips_by_track_number:
                raise Exception("All tracks failed to process")

            # Create permanent directory for this junt
            from services.library import get_montages_dir
            junt_dir = get_montages_dir() / job_id
            junt_dir.mkdir(exist_ok=True)

            # Move clips to permanent storage and build track data
            tracks_data = []
            sorted_track_numbers = sorted(clips_by_track_number.keys())

            for track_number in sorted_track_numbers:
                temp_clip_path = clips_by_track_number[track_number]

                # Create permanent filename: track_01.mp3, track_02.mp3, etc.
                permanent_filename = f"track_{track_number:02d}.mp3"
                permanent_path = junt_dir / permanent_filename

                # Move clip to permanent storage
                shutil.move(temp_clip_path, permanent_path)

                # Find track info
                track_info = next((t for t in album.tracks if t.number == track_number), None)

                # Build track data
                tracks_data.append({
                    "number": track_number,
                    "title": track_info.title if track_info else f"Track {track_number}",
                    "duration": track_info.duration if track_info else 0,
                    "file_path": str(permanent_path)
                })

            # Mark job as complete
            job.status = "completed"
            job.progress = 1.0

            await self._notify_callbacks(job_id, "done", {
                "junt_id": job_id,
                "tracks": tracks_data,
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

            temp_dir = Path("temp")
            for pattern in [f"{job_id}_track_*.mp3", f"{job_id}_clip_*.mp3"]:
                for temp_file in temp_dir.glob(pattern):
                    try:
                        temp_file.unlink()
                        print(f"Cleaned up temp file after job failure: {temp_file.name}")
                    except Exception as cleanup_error:
                        print(f"Error cleaning up {temp_file.name}: {cleanup_error}")


# Global job manager instance
job_manager = JobManager()
