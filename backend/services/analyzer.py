import librosa
import numpy as np
from scipy.ndimage import uniform_filter1d
from typing import Tuple


class AnalyzerService:
    @staticmethod
    async def find_peak_energy_window(audio_path: str, clip_duration: float) -> Tuple[float, float]:
        """
        Find the most energetic section of an audio file.

        Args:
            audio_path: Path to audio file
            clip_duration: Desired clip duration in seconds

        Returns:
            Tuple of (start_time, end_time) in seconds
        """
        try:
            # Load audio
            y, sr = librosa.load(audio_path, sr=22050, mono=True)

            # Skip first/last 10% (intros/outros)
            margin = int(len(y) * 0.1)
            if margin * 2 >= len(y):
                # File too short, use whole thing
                margin = 0

            y_core = y[margin:-margin] if margin > 0 else y

            # Calculate RMS energy in frames
            frame_length = 2048
            hop_length = 512
            rms = librosa.feature.rms(
                y=y_core,
                frame_length=frame_length,
                hop_length=hop_length
            )[0]

            # Smooth the energy curve
            window_size = min(50, len(rms) // 4)
            if window_size > 0:
                rms_smooth = uniform_filter1d(rms, size=window_size)
            else:
                rms_smooth = rms

            # Find window with highest average energy
            window_frames = int(clip_duration * sr / hop_length)

            if window_frames >= len(rms_smooth):
                # Clip duration longer than available audio
                start_time = margin / sr
                end_time = min(start_time + clip_duration, len(y) / sr)
                return start_time, end_time

            max_energy = 0
            best_start = 0

            for i in range(len(rms_smooth) - window_frames):
                window_energy = np.mean(rms_smooth[i:i + window_frames])
                if window_energy > max_energy:
                    max_energy = window_energy
                    best_start = i

            # Convert frame position to time
            start_time = margin / sr + (best_start * hop_length / sr)
            end_time = start_time + clip_duration

            # Ensure we don't exceed file duration
            total_duration = len(y) / sr
            if end_time > total_duration:
                end_time = total_duration
                start_time = max(0, end_time - clip_duration)

            return start_time, end_time

        except Exception as e:
            print(f"Error analyzing {audio_path}: {e}")
            # Fallback: use middle 30% of track
            try:
                duration = librosa.get_duration(path=audio_path)
                start_time = duration * 0.35
                end_time = min(start_time + clip_duration, duration * 0.65)
                return start_time, end_time
            except:
                # Last resort fallback
                return 30.0, 30.0 + clip_duration
