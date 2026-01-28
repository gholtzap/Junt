from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class DurationType(str, Enum):
    SHORT = "short"
    MEDIUM = "medium"
    LONG = "long"


class Track(BaseModel):
    number: int
    title: str
    duration: Optional[int] = None  # Duration in seconds
    file_path: Optional[str] = None  # Path to individual track file


class AlbumSearchResult(BaseModel):
    mbid: str
    title: str
    artist: str
    year: Optional[int] = None
    cover_url: Optional[str] = None


class AlbumDetail(BaseModel):
    mbid: str
    title: str
    artist: str
    year: Optional[int] = None
    cover_url: Optional[str] = None
    tracks: List[Track]


class AlbumSearchResponse(BaseModel):
    albums: List[AlbumSearchResult]


class MontageCreateRequest(BaseModel):
    mbid: str
    duration: DurationType


class MontageCreateResponse(BaseModel):
    job_id: str


class TrackStatus(BaseModel):
    track_number: int
    track_title: str
    status: str  # "pending", "downloading", "analyzing", "complete", "failed"
    error: Optional[str] = None


class JobStatus(BaseModel):
    status: str  # "queued", "processing", "completed", "failed"
    progress: float  # 0.0 to 1.0
    current_track: Optional[int] = None
    total_tracks: int
    completed_tracks: int
    track_statuses: List[TrackStatus]
    errors: List[str] = []
    file_path: Optional[str] = None


class WebSocketMessage(BaseModel):
    type: str  # "progress", "track_complete", "error", "done"
    data: dict


# Library schemas
class MontageSaveRequest(BaseModel):
    job_id: str
    album: AlbumDetail
    duration_type: DurationType


class SavedMontage(BaseModel):
    id: str
    album: AlbumDetail
    duration_type: DurationType
    tracks: List[Track]  # Individual tracks with file paths
    created_at: str


class LibraryResponse(BaseModel):
    montages: List[SavedMontage]
    total: int


# Playlist schemas
class PlaylistItemBase(BaseModel):
    """Base class for playlist items."""
    id: str
    type: str  # "track" or "junt"
    junt_id: str
    added_at: str


class PlaylistTrackItem(PlaylistItemBase):
    """Playlist item referencing a specific track within a junt."""
    type: str = "track"
    track_number: int


class PlaylistJuntItem(PlaylistItemBase):
    """Playlist item referencing an entire junt."""
    type: str = "junt"


class Playlist(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    items: List[PlaylistItemBase]
    created_at: str
    updated_at: str


class PlaylistCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None


class PlaylistUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class AddTrackToPlaylistRequest(BaseModel):
    junt_id: str
    track_number: int


class AddJuntToPlaylistRequest(BaseModel):
    junt_id: str


class ReorderPlaylistRequest(BaseModel):
    item_ids: List[str]  # New order of item IDs


class PlaylistListResponse(BaseModel):
    playlists: List[Playlist]
    total: int
