import yt_dlp
import os
from typing import Optional


class DownloaderService:
    def __init__(self, output_dir: str = "temp"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

    async def download_track(self, artist: str, track_name: str, output_filename: str) -> Optional[str]:
        """
        Download a track from YouTube.

        Args:
            artist: Artist name
            track_name: Track name
            output_filename: Output filename (without extension)

        Returns:
            Path to downloaded file or None if failed
        """
        search_query = f"{artist} {track_name} audio"
        output_path = os.path.join(self.output_dir, output_filename)

        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'outtmpl': output_path,
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'default_search': 'ytsearch1',
            'nocheckcertificate': True,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # Search and download the first result
                info = ydl.extract_info(f"ytsearch1:{search_query}", download=True)

                if info and 'entries' in info and len(info['entries']) > 0:
                    # yt-dlp adds .mp3 extension automatically
                    final_path = f"{output_path}.mp3"

                    if os.path.exists(final_path):
                        print(f"Downloaded: {search_query} -> {final_path}")
                        return final_path
                    else:
                        print(f"File not found after download: {final_path}")
                        return None
                else:
                    print(f"No results found for: {search_query}")
                    return None

        except Exception as e:
            print(f"Error downloading {search_query}: {e}")
            return None

    def cleanup(self, file_path: str):
        """Remove a temporary file."""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"Error cleaning up {file_path}: {e}")

    def cleanup_all(self):
        """Remove all temporary files."""
        try:
            for filename in os.listdir(self.output_dir):
                file_path = os.path.join(self.output_dir, filename)
                if os.path.isfile(file_path):
                    os.remove(file_path)
        except Exception as e:
            print(f"Error cleaning up temp directory: {e}")
