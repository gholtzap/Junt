# Junt

Find your favorite track without hitting skip. The fastest way to digest any new release.

## Features

- Search for albums using MusicBrainz metadata
- Download audio from YouTube using yt-dlp
- Analyze tracks with librosa to find peak energy moments
- Generate montages with crossfades and volume normalization
- Real-time progress updates via WebSocket
- Dynamic UI colors extracted from album artwork
- Built-in audio player with waveform visualization

## Tech Stack

**Backend:**
- FastAPI (async API with WebSocket support)
- librosa (audio energy analysis)
- pydub + ffmpeg (audio processing)
- yt-dlp (YouTube audio downloading)
- musicbrainzngs (MusicBrainz API)
- pyloudnorm (LUFS normalization)

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- Framer Motion (animations)
- ColorThief (album artwork color extraction)

## Prerequisites

- Python 3.10+
- Node.js 18+
- ffmpeg (required for audio processing)

### Install ffmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html

## Installation

### Backend Setup

1. Create a virtual environment (if not already created):
```bash
cd backend
python3 -m venv venv
```

2. Activate the virtual environment:
```bash
source backend/venv/bin/activate  # On Windows: backend\venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r backend/requirements.txt
```

### Frontend Setup

Install dependencies:
```bash
cd frontend
npm install
cd ..
```

## Running the Application

### Quick Start (Both Services)

Use the provided startup script from the root directory:
```bash
./start.sh
```

This will start both the backend and frontend servers. Press Ctrl+C to stop both.

### Manual Start

#### Start the Backend

From the root directory:
```bash
source backend/venv/bin/activate
cd backend
uvicorn main:app --reload
```

The API will be available at http://localhost:8000

API documentation: http://localhost:8000/docs

#### Start the Frontend

In a new terminal, from the root directory:

```bash
cd frontend
npm run dev
```

The frontend will be available at http://localhost:5173

## Usage

1. Search for an album by artist or title
2. Select an album from the search results
3. Review the album details and tracklist
4. Choose a duration preset:
   - **Short**: 6-second clips (~1 minute total)
   - **Medium**: 11-second clips (~2 minutes total)
   - **Long**: 21-second clips (~3 minutes total)
5. Watch real-time progress as tracks are downloaded and analyzed
6. Play the completed montage in the browser
7. Download the MP3 file

## How It Works

### Audio Analysis

The app uses librosa to analyze each track:

1. Loads audio at 22050 Hz sample rate
2. Skips the first/last 10% (intros/outros)
3. Calculates RMS energy across frames
4. Smooths the energy curve
5. Finds the window with highest average energy
6. Extracts that clip segment

### Processing Pipeline

1. Download audio from YouTube (best quality, converts to MP3)
2. Analyze with librosa to find peak energy window
3. Extract clip segment with pydub
4. Normalize all clips to -14 LUFS (streaming standard)
5. Apply crossfades between clips
6. Concatenate into final montage
7. Export as 320kbps MP3

## Project Structure

```
album-previewer-full-stack/
├── backend/
│   ├── main.py                 # FastAPI app entry
│   ├── requirements.txt
│   ├── api/
│   │   ├── routes/             # API endpoints
│   │   └── schemas.py          # Pydantic models
│   ├── services/
│   │   ├── metadata.py         # MusicBrainz integration
│   │   ├── downloader.py       # yt-dlp wrapper
│   │   ├── analyzer.py         # librosa analysis
│   │   ├── processor.py        # Audio processing
│   │   └── jobs.py             # Job management
│   └── temp/                   # Temporary files
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom hooks
│   │   └── lib/                # Utilities
│   └── package.json
└── README.md
```

## API Endpoints

- `GET /api/album/search?q={query}` - Search for albums
- `GET /api/album/{mbid}` - Get album details
- `POST /api/montage/create` - Start montage creation
- `GET /api/montage/{job_id}/status` - Get job status
- `GET /api/montage/{job_id}/download` - Download montage
- `WS /ws/progress/{job_id}` - Real-time progress updates

## Error Handling

- Failed track downloads are skipped automatically
- If analysis fails, falls back to middle 30% of track
- All errors are logged and reported in the UI
- Partial montages are still created if some tracks succeed

## Performance

- Async operations throughout
- Parallel processing where possible
- Efficient memory usage with streaming
- Temporary file cleanup

## Troubleshooting

**Backend won't start:**
- Ensure Python 3.10+ is installed
- Check that all dependencies are installed
- Verify ffmpeg is available: `ffmpeg -version`

**Frontend won't start:**
- Ensure Node.js 18+ is installed
- Try deleting `node_modules` and running `npm install` again

**Downloads failing:**
- Check your internet connection
- yt-dlp may need updating: `pip install --upgrade yt-dlp`
- Some videos may be region-restricted

**Audio processing errors:**
- Ensure ffmpeg is properly installed
- Check available disk space in `backend/temp/`

## License

MIT

## Credits

- MusicBrainz for album metadata
- YouTube for audio source
- librosa for audio analysis
- All open-source dependencies
