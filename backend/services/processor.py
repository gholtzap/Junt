from pydub import AudioSegment
import pyloudnorm as pyln
import numpy as np
import librosa
import soundfile as sf
import os
from typing import List, Tuple
from api.schemas import DurationType


class ProcessorService:
    # Duration presets (percentage, crossfade_duration)
    # Percentage is applied to each track's duration
    DURATION_PRESETS = {
        DurationType.SHORT: (0.10, 0.3),   # 10% of track
        DurationType.MEDIUM: (0.20, 0.5),  # 20% of track
        DurationType.LONG: (0.30, 0.75),   # 30% of track
    }

    @staticmethod
    def get_clip_percentage(duration_type: DurationType) -> Tuple[float, float]:
        """Get clip percentage and crossfade for a duration type."""
        return ProcessorService.DURATION_PRESETS[duration_type]

    @staticmethod
    def calculate_clip_duration(track_duration: int, percentage: float, fallback_duration: float = 180.0) -> float:
        """
        Calculate clip duration based on track duration and percentage.

        Args:
            track_duration: Track duration in seconds (can be None)
            percentage: Percentage of track to use (0.0 to 1.0)
            fallback_duration: Default duration if track duration is unavailable

        Returns:
            Clip duration in seconds
        """
        if track_duration and track_duration > 0:
            clip_duration = track_duration * percentage
            # Ensure minimum of 3 seconds and maximum of 60 seconds per clip
            return max(3.0, min(60.0, clip_duration))
        else:
            # Fallback if track duration is unavailable (assume ~3 minute track)
            return fallback_duration * percentage

    @staticmethod
    async def extract_clip(
        audio_path: str,
        start_time: float,
        end_time: float,
        output_path: str
    ) -> str:
        """
        Extract a clip from an audio file.

        Args:
            audio_path: Source audio file
            start_time: Start time in seconds
            end_time: End time in seconds
            output_path: Output file path

        Returns:
            Path to extracted clip
        """
        try:
            audio = AudioSegment.from_file(audio_path)

            # Convert to milliseconds
            start_ms = int(start_time * 1000)
            end_ms = int(end_time * 1000)

            # Extract clip
            clip = audio[start_ms:end_ms]

            # Export as high-quality MP3
            clip.export(output_path, format="mp3", bitrate="192k")

            return output_path

        except Exception as e:
            print(f"Error extracting clip from {audio_path}: {e}")
            raise

    @staticmethod
    async def normalize_audio(audio_path: str, target_lufs: float = -14.0) -> str:
        """
        Normalize audio to target LUFS (streaming standard is -14 LUFS).

        Args:
            audio_path: Path to audio file
            target_lufs: Target loudness in LUFS

        Returns:
            Path to normalized audio (overwrites original)
        """
        try:
            # Load audio
            data, rate = librosa.load(audio_path, sr=None, mono=False)

            # Ensure 2D array for stereo handling
            if data.ndim == 1:
                data = np.array([data, data])

            # Measure loudness
            meter = pyln.Meter(rate)
            loudness = meter.integrated_loudness(data.T)

            # Normalize
            normalized = pyln.normalize.loudness(data.T, loudness, target_lufs)

            # Save
            sf.write(audio_path, normalized, rate)

            return audio_path

        except Exception as e:
            print(f"Error normalizing {audio_path}: {e}")
            # If normalization fails, return original
            return audio_path

    @staticmethod
    async def create_montage(
        clip_paths: List[str],
        output_path: str,
        crossfade_duration: float
    ) -> str:
        """
        Combine clips into a montage with crossfades.

        Args:
            clip_paths: List of clip file paths
            output_path: Output file path
            crossfade_duration: Crossfade duration in seconds

        Returns:
            Path to created montage
        """
        try:
            if not clip_paths:
                raise ValueError("No clips provided")

            # Load first clip
            montage = AudioSegment.from_file(clip_paths[0])

            # Add remaining clips with crossfade
            crossfade_ms = int(crossfade_duration * 1000)

            for clip_path in clip_paths[1:]:
                clip = AudioSegment.from_file(clip_path)
                montage = montage.append(clip, crossfade=crossfade_ms)

            # Export final montage as high-quality MP3
            montage.export(output_path, format="mp3", bitrate="320k")

            print(f"Created montage: {output_path} ({len(clip_paths)} clips)")
            return output_path

        except Exception as e:
            print(f"Error creating montage: {e}")
            raise

    @staticmethod
    async def create_progressive_montage(
        clip_paths: List[str],
        output_path: str,
        crossfade_duration: float
    ) -> str:
        """
        Create or update a progressive montage as new clips become available.
        This allows for incremental montage building where users can start
        listening before all tracks are processed.

        Args:
            clip_paths: List of all clip file paths available so far
            output_path: Output file path (will be overwritten)
            crossfade_duration: Crossfade duration in seconds

        Returns:
            Path to created/updated montage
        """
        try:
            if not clip_paths:
                raise ValueError("No clips provided")

            # Build montage from all available clips
            montage = AudioSegment.from_file(clip_paths[0])

            crossfade_ms = int(crossfade_duration * 1000)

            for clip_path in clip_paths[1:]:
                clip = AudioSegment.from_file(clip_path)
                montage = montage.append(clip, crossfade=crossfade_ms)

            # Export as high-quality MP3 (overwrites previous version)
            montage.export(output_path, format="mp3", bitrate="320k")

            print(f"Updated progressive montage: {output_path} ({len(clip_paths)} clips)")
            return output_path

        except Exception as e:
            print(f"Error creating progressive montage: {e}")
            raise

    @staticmethod
    def cleanup_clips(clip_paths: List[str]):
        """Remove temporary clip files."""
        for clip_path in clip_paths:
            try:
                if os.path.exists(clip_path):
                    os.remove(clip_path)
            except Exception as e:
                print(f"Error removing {clip_path}: {e}")
