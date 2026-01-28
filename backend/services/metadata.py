import musicbrainzngs
import ssl
import certifi
import asyncio
from typing import List, Optional
from api.schemas import AlbumSearchResult, AlbumDetail, Track

# Set up MusicBrainz client
musicbrainzngs.set_useragent(
    "AlbumPreviewMontage",
    "1.0",
    "https://github.com/yourusername/album-previewer"
)

# Configure SSL context to use certifi certificates
ssl._create_default_https_context = lambda: ssl.create_default_context(cafile=certifi.where())


class MetadataService:
    @staticmethod
    async def search_albums(query: str, limit: int = 10) -> List[AlbumSearchResult]:
        """Search for albums using MusicBrainz."""
        try:
            # Run blocking call in thread pool to avoid blocking event loop
            result = await asyncio.to_thread(
                musicbrainzngs.search_releases,
                query=query,
                limit=limit,
                strict=False
            )

            albums = []
            for release in result.get('release-list', []):
                # Extract year from date
                year = None
                if 'date' in release:
                    try:
                        year = int(release['date'][:4])
                    except (ValueError, IndexError):
                        pass

                # Get album art URL from Cover Art Archive
                cover_url = None
                mbid = release['id']
                if mbid:
                    cover_url = f"https://coverartarchive.org/release/{mbid}/front-500"

                # Extract relevance score from MusicBrainz
                score = int(release.get('ext:score', 0))

                albums.append({
                    'result': AlbumSearchResult(
                        mbid=mbid,
                        title=release.get('title', 'Unknown Album'),
                        artist=release.get('artist-credit-phrase', 'Unknown Artist'),
                        year=year,
                        cover_url=cover_url
                    ),
                    'score': score
                })

            # Sort by relevance score (highest first)
            albums.sort(key=lambda x: x['score'], reverse=True)

            # Remove duplicates: keep only the first (highest scored) instance of each title+artist combination
            seen = set()
            unique_albums = []
            for album in albums:
                # Create a normalized key for deduplication (lowercase, stripped)
                key = (
                    album['result'].title.lower().strip(),
                    album['result'].artist.lower().strip()
                )
                if key not in seen:
                    seen.add(key)
                    unique_albums.append(album['result'])

            return unique_albums
        except Exception as e:
            print(f"Error searching albums: {e}")
            return []

    @staticmethod
    async def get_album_details(mbid: str) -> Optional[AlbumDetail]:
        """Get detailed album information including tracklist."""
        try:
            # Run blocking call in thread pool to avoid blocking event loop
            result = await asyncio.to_thread(
                musicbrainzngs.get_release_by_id,
                mbid,
                includes=['artists', 'recordings']
            )

            release = result.get('release', {})

            # Extract year
            year = None
            if 'date' in release:
                try:
                    year = int(release['date'][:4])
                except (ValueError, IndexError):
                    pass

            # Get cover art URL
            cover_url = f"https://coverartarchive.org/release/{mbid}/front-500"

            # Extract tracks
            tracks = []
            medium_list = release.get('medium-list', [])

            for medium in medium_list:
                for track_data in medium.get('track-list', []):
                    recording = track_data.get('recording', {})

                    # Duration in milliseconds, convert to seconds
                    duration = None
                    if 'length' in recording:
                        try:
                            duration = int(recording['length']) // 1000
                        except (ValueError, TypeError):
                            pass

                    tracks.append(Track(
                        number=int(track_data.get('position', 0)),
                        title=recording.get('title', 'Unknown Track'),
                        duration=duration
                    ))

            return AlbumDetail(
                mbid=mbid,
                title=release.get('title', 'Unknown Album'),
                artist=release.get('artist-credit-phrase', 'Unknown Artist'),
                year=year,
                cover_url=cover_url,
                tracks=tracks
            )

        except Exception as e:
            print(f"Error getting album details: {e}")
            return None
