# Junt

Junt breaks down albums into shorter, bite-sized chunks (10%, 20%, or 30%) of thier original length. This is the way to listen to music in the Tiktok generation.

## Legal Disclaimer

**This software is provided for educational purposes only.** Downloading copyrighted content from YouTube may violate YouTube's Terms of Service and copyright laws in your jurisdiction. This tool should only be used with content you own or have explicit permission to download.

**By using this software, you assume all legal responsibility for your actions.** The developers are not responsible for any misuse or legal consequences resulting from the use of this software.

## Why is this not shipped as a Saas?

Because that would be illegal. Read 'Legal Disclaimer' above.

## Running the app

```
./start.sh
```

## Configuration

You can configure Junt using environment variables. Create a `.env` file in the root directory or set these variables in your environment:

### Available Environment Variables

- `ALLOWED_ORIGINS` - CORS origins (default: `http://localhost:5173,http://localhost:3000`)
- `SECRET_KEY` - Secret key for authentication (currently unused)
- `MONGODB_URI` - MongoDB connection URI (currently unused)
- `TEMP_DIR` - Directory for temporary files (default: `temp`)
- `CLEANUP_ENABLED` - Enable automatic cleanup of orphaned temp files (default: `true`)
- `CLEANUP_MAX_AGE_HOURS` - Maximum age of temp files before cleanup (default: `1`)
- `CLEANUP_INTERVAL_MINUTES` - Interval between cleanup runs (default: `30`)

See `.env.example` for a template.

### Cleanup Service

Junt automatically cleans up orphaned temporary files to prevent disk space issues. The cleanup service:

- Runs every 30 minutes by default
- Removes temp files older than 1 hour by default
- Cleans up files from failed or interrupted jobs
- Can be manually triggered via API endpoints

**API Endpoints:**
- `GET /api/cleanup/info` - View current temp files
- `GET /api/cleanup/status` - Check cleanup service status
- `POST /api/cleanup/orphaned` - Manually trigger cleanup of old files
- `POST /api/cleanup/force` - Force cleanup of all temp files (use with caution)

## Credits

- MusicBrainz for album metadata
- YouTube for audio source
- librosa for audio analysis
- All open-source dependencies
