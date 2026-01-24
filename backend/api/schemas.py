from pydantic import BaseModel, EmailStr
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


# Auth schemas
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    username: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Library schemas
class MontageSaveRequest(BaseModel):
    job_id: str
    album: AlbumDetail
    duration_type: DurationType


class SavedMontage(BaseModel):
    id: str
    album: AlbumDetail
    duration_type: DurationType
    track_count: int
    created_at: str


class LibraryResponse(BaseModel):
    montages: List[SavedMontage]
    total: int
