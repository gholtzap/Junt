import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { TrackProgress } from './TrackProgress';

export function ProcessingView({ jobId, albumData, durationType, onReset, onGoToLibrary }) {
  const [status, setStatus] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [tracksData, setTracksData] = useState([]);

  const handleMessage = useCallback((message) => {
    console.log('WebSocket message:', message);

    if (message.type === 'status' || message.type === 'progress') {
      // Merge partial updates with existing status to preserve all fields
      setStatus((prevStatus) => prevStatus
        ? { ...prevStatus, ...message.data }
        : prevStatus  // Keep null if not yet initialized (API will set it)
      );
    } else if (message.type === 'track_complete') {
      // Refresh status and check if job completed
      api.getJobStatus(jobId).then((newStatus) => {
        setStatus(newStatus);
        if (newStatus.status === 'completed') {
          setIsComplete(true);
        }
      });
    } else if (message.type === 'done') {
      setIsComplete(true);
      // Capture tracks data from the done message
      if (message.data.tracks) {
        setTracksData(message.data.tracks);
      }
      api.getJobStatus(jobId).then(setStatus);
    }
  }, [jobId]);

  useWebSocket(jobId, handleMessage);

  const handleSave = async () => {
    if (isSaving || isSaved) return;

    setIsSaving(true);
    try {
      // If tracksData is empty, reconstruct it from successful track statuses
      let tracks = tracksData;
      if (!tracks || tracks.length === 0) {
        // Build tracks array from successful track statuses
        tracks = status.track_statuses
          .filter(ts => ts.status === 'complete')
          .map(ts => {
            // Find the track info from albumData
            const trackInfo = albumData.tracks.find(t => t.number === ts.track_number);
            return {
              number: ts.track_number,
              title: ts.track_title,
              duration: trackInfo?.duration || 0
              // file_path will be constructed by the backend
            };
          });
      }

      await api.saveMontage(jobId, albumData, durationType, tracks);
      setIsSaved(true);
    } catch (error) {
      console.error('Failed to save montage:', error);
      alert('Failed to save montage. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    // Initial status fetch
    api.getJobStatus(jobId).then(setStatus);

    // Polling for status updates (fallback if WebSocket fails, and safety net for completion)
    const interval = setInterval(() => {
      api.getJobStatus(jobId).then((newStatus) => {
        setStatus(newStatus);
        if (newStatus.status === 'completed' || newStatus.status === 'failed') {
          setIsComplete(true);
          clearInterval(interval);
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full spinner" />
      </div>
    );
  }

  // Show completion UI when job is done
  if (isComplete && status?.status === 'completed') {
    // Allow saving if we have tracks data OR if at least one track completed successfully
    const hasValidTracks = (tracksData && tracksData.length > 0) || (status.completed_tracks > 0);

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl text-center"
        >
          <div className="mb-8">
            {albumData?.cover_url && (
              <motion.img
                src={albumData.cover_url}
                alt={albumData.title}
                className="w-64 h-64 rounded-lg object-cover mx-auto mb-6 accent-glow-strong"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              />
            )}
            <h2 className="text-5xl font-bold mb-4 tracking-tight">
              Junt Ready
            </h2>
            <p className="text-gray-400 text-lg mb-2">
              {albumData?.title} by {albumData?.artist}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {status.completed_tracks} / {status.total_tracks} tracks processed
            </p>

            {isSaved ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 p-3 bg-green-500/10 backdrop-blur-md border border-green-500/20 rounded-lg inline-block"
              >
                <div className="flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Saved to Library!</span>
                </div>
              </motion.div>
            ) : hasValidTracks && (
              <p className="text-sm text-green-400 mb-4">
                {(tracksData && tracksData.length > 0) ? tracksData.length : status.completed_tracks} track{((tracksData && tracksData.length > 0) ? tracksData.length : status.completed_tracks) !== 1 ? 's' : ''} ready to save
              </p>
            )}
          </div>

          <div className="flex gap-4 justify-center">
            {!isSaved ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={isSaving || !hasValidTracks}
                className="px-8 py-4 rounded-lg font-semibold text-lg accent-bg hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {isSaving ? 'Saving...' : 'Save to Library'}
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onGoToLibrary}
                  className="px-8 py-4 rounded-lg accent-bg font-semibold text-lg hover:opacity-90 transition-opacity"
                >
                  Go to Library
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onReset}
                  className="px-8 py-4 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors"
                >
                  Create Another Junt
                </motion.button>
              </>
            )}
          </div>

          {status.errors && status.errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 p-4 bg-yellow-500/10 backdrop-blur-md border border-yellow-500/20 rounded-lg text-left"
            >
              <div className="font-semibold text-yellow-400 mb-2">
                Some tracks were skipped:
              </div>
              <ul className="text-sm text-gray-400 space-y-1">
                {status.errors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </motion.div>
          )}

          {status.track_statuses && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8"
            >
              <div className="text-sm font-semibold text-gray-400 mb-4">
                Track Summary
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {status.track_statuses.map((trackStatus) => (
                  <TrackProgress key={trackStatus.track_number} trackStatus={trackStatus} />
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        <div className="text-center mb-12">
          {albumData?.cover_url && (
            <motion.img
              src={albumData.cover_url}
              alt={albumData.title}
              className="w-48 h-48 rounded-lg object-cover mx-auto mb-6 accent-glow"
              animate={{ rotate: [0, 2, -2, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          )}
          <h2 className="text-4xl font-bold mb-4 tracking-tight">
            Creating Junt
          </h2>
          <p className="text-gray-400 text-lg mb-6">
            Finding the best moments...
          </p>

          {/* Progress bar */}
          <div className="w-full max-w-md mx-auto mb-4">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full accent-bg"
                initial={{ width: 0 }}
                animate={{ width: `${status.progress * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-2 font-mono">
              <span>
                {status.completed_tracks} / {status.total_tracks} tracks
              </span>
              <span>{Math.round(status.progress * 100)}%</span>
            </div>
          </div>

          {status.current_track && (
            <div className="text-gray-400 animate-pulse">
              {/* Show finalizing message when all tracks are processed */}
              {status.track_statuses?.every(t => t.status === 'complete' || t.status === 'failed')
                ? 'Finalizing montage...'
                : `Processing track ${status.current_track}...`
              }
            </div>
          )}
        </div>

        {/* Track status list */}
        {status.track_statuses && status.track_statuses.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {status.track_statuses.map((trackStatus) => (
              <TrackProgress key={trackStatus.track_number} trackStatus={trackStatus} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
