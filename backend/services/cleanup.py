import os
import asyncio
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict

logger = logging.getLogger(__name__)


class CleanupService:
    def __init__(self, temp_dir: str = "temp", max_age_hours: int = 1):
        self.temp_dir = Path(temp_dir)
        self.max_age_hours = max_age_hours
        self.temp_dir.mkdir(exist_ok=True)
        self._cleanup_task = None
        self._running = False

    def start_periodic_cleanup(self, interval_minutes: int = 30):
        """Start periodic cleanup task."""
        if self._cleanup_task is None or self._cleanup_task.done():
            self._running = True
            self._cleanup_task = asyncio.create_task(self._periodic_cleanup(interval_minutes))
            logger.info(f"Started periodic cleanup (interval: {interval_minutes} minutes, max age: {self.max_age_hours} hours)")

    async def stop_periodic_cleanup(self):
        """Stop periodic cleanup task."""
        self._running = False
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            logger.info("Stopped periodic cleanup")

    async def _periodic_cleanup(self, interval_minutes: int):
        """Run cleanup periodically."""
        while self._running:
            try:
                await self.cleanup_orphaned_files()
                await asyncio.sleep(interval_minutes * 60)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in periodic cleanup: {e}", exc_info=True)
                await asyncio.sleep(interval_minutes * 60)

    async def cleanup_orphaned_files(self) -> Dict[str, any]:
        """
        Clean up orphaned temporary files older than max_age_hours.

        Returns:
            Dict with cleanup statistics
        """
        cutoff_time = datetime.now() - timedelta(hours=self.max_age_hours)

        deleted_files = []
        errors = []
        total_size = 0

        try:
            if not self.temp_dir.exists():
                return {
                    "deleted_count": 0,
                    "deleted_files": [],
                    "total_size_mb": 0,
                    "errors": []
                }

            for file_path in self.temp_dir.iterdir():
                if not file_path.is_file():
                    continue

                try:
                    file_stat = file_path.stat()
                    file_mtime = datetime.fromtimestamp(file_stat.st_mtime)

                    if file_mtime < cutoff_time:
                        file_size = file_stat.st_size
                        file_path.unlink()

                        deleted_files.append({
                            "name": file_path.name,
                            "size_bytes": file_size,
                            "age_hours": (datetime.now() - file_mtime).total_seconds() / 3600
                        })
                        total_size += file_size

                        logger.info(f"Deleted orphaned file: {file_path.name} (age: {(datetime.now() - file_mtime).total_seconds() / 3600:.1f}h, size: {file_size / 1024 / 1024:.2f}MB)")

                except Exception as e:
                    error_msg = f"Error processing {file_path.name}: {str(e)}"
                    errors.append(error_msg)
                    logger.error(error_msg)

        except Exception as e:
            error_msg = f"Error scanning temp directory: {str(e)}"
            errors.append(error_msg)
            logger.error(error_msg, exc_info=True)

        result = {
            "deleted_count": len(deleted_files),
            "deleted_files": deleted_files,
            "total_size_mb": round(total_size / 1024 / 1024, 2),
            "errors": errors
        }

        if deleted_files:
            logger.info(f"Cleanup complete: {len(deleted_files)} files deleted, {result['total_size_mb']}MB freed")

        return result

    async def force_cleanup_all(self) -> Dict[str, any]:
        """
        Force cleanup of ALL temp files regardless of age.
        Use with caution - may delete files from active jobs.

        Returns:
            Dict with cleanup statistics
        """
        deleted_files = []
        errors = []
        total_size = 0

        try:
            if not self.temp_dir.exists():
                return {
                    "deleted_count": 0,
                    "deleted_files": [],
                    "total_size_mb": 0,
                    "errors": []
                }

            for file_path in self.temp_dir.iterdir():
                if not file_path.is_file():
                    continue

                try:
                    file_size = file_path.stat().st_size
                    file_path.unlink()

                    deleted_files.append({
                        "name": file_path.name,
                        "size_bytes": file_size
                    })
                    total_size += file_size

                except Exception as e:
                    error_msg = f"Error deleting {file_path.name}: {str(e)}"
                    errors.append(error_msg)
                    logger.error(error_msg)

        except Exception as e:
            error_msg = f"Error scanning temp directory: {str(e)}"
            errors.append(error_msg)
            logger.error(error_msg, exc_info=True)

        result = {
            "deleted_count": len(deleted_files),
            "deleted_files": deleted_files,
            "total_size_mb": round(total_size / 1024 / 1024, 2),
            "errors": errors
        }

        logger.info(f"Force cleanup complete: {len(deleted_files)} files deleted, {result['total_size_mb']}MB freed")

        return result

    def get_temp_files_info(self) -> Dict[str, any]:
        """
        Get information about current temp files.

        Returns:
            Dict with temp files statistics
        """
        files_info = []
        total_size = 0
        cutoff_time = datetime.now() - timedelta(hours=self.max_age_hours)

        try:
            if not self.temp_dir.exists():
                return {
                    "total_count": 0,
                    "total_size_mb": 0,
                    "orphaned_count": 0,
                    "files": []
                }

            for file_path in self.temp_dir.iterdir():
                if not file_path.is_file():
                    continue

                try:
                    file_stat = file_path.stat()
                    file_mtime = datetime.fromtimestamp(file_stat.st_mtime)
                    file_size = file_stat.st_size
                    is_orphaned = file_mtime < cutoff_time

                    files_info.append({
                        "name": file_path.name,
                        "size_bytes": file_size,
                        "size_mb": round(file_size / 1024 / 1024, 2),
                        "age_hours": round((datetime.now() - file_mtime).total_seconds() / 3600, 2),
                        "is_orphaned": is_orphaned,
                        "modified": file_mtime.isoformat()
                    })
                    total_size += file_size

                except Exception as e:
                    logger.error(f"Error getting info for {file_path.name}: {e}")

        except Exception as e:
            logger.error(f"Error scanning temp directory: {e}", exc_info=True)

        orphaned_count = sum(1 for f in files_info if f["is_orphaned"])

        return {
            "total_count": len(files_info),
            "total_size_mb": round(total_size / 1024 / 1024, 2),
            "orphaned_count": orphaned_count,
            "files": sorted(files_info, key=lambda x: x["age_hours"], reverse=True)
        }


from config.settings import settings

cleanup_service = CleanupService(
    temp_dir=settings.TEMP_DIR,
    max_age_hours=settings.CLEANUP_MAX_AGE_HOURS
)
