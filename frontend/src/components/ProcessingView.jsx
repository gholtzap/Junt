import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { TrackProgress } from './TrackProgress';
import { AudioPlayer } from './AudioPlayer';

export function ProcessingView({ jobId, albumData, durationType, onReset, onUpgradeClick }) {
  const [status, setStatus] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isPartialReady, setIsPartialReady] = useState(false);
  const [partialMessage, setPartialMessage] = useState('');

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
    } else if (message.type === 'partial_ready') {
      // Partial montage is ready - user can start listening!
      setIsPartialReady(true);
      setPartialMessage(message.data.message || 'First few tracks ready! More are being added...');
      api.getJobStatus(jobId).then(setStatus);
    } else if (message.type === 'done') {
      setIsComplete(true);
      api.getJobStatus(jobId).then(setStatus);
    }
  }, [jobId]);

  useWebSocket(jobId, handleMessage);

  const handleSave = async () => {
    if (isSaving || isSaved) return;

    setIsSaving(true);
    try {
      await api.saveMontage(jobId, albumData, durationType);
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

  // Show player early if partial montage is ready (even if not fully complete)
  if ((isPartialReady || isComplete) && status?.file_path) {
    const fullyComplete = isComplete && status.status === 'completed';
    const stillProcessing = !fullyComplete && isPartialReady;

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
              {fullyComplete ? 'Junt Ready' : 'Preview Ready'}
            </h2>
            <p className="text-gray-400 text-lg mb-2">
              {albumData?.title} by {albumData?.artist}
            </p>
            <p className="text-sm text-gray-500">
              {status.completed_tracks} / {status.total_tracks} tracks processed
            </p>

            {stillProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
              >
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">
                    {partialMessage || 'Adding more tracks...'}
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          <div className="mb-8">
            <AudioPlayer audioUrl={api.getDownloadUrl(jobId)} onUpgradeClick={onUpgradeClick} />
          </div>

          {fullyComplete ? (
            <div className="flex gap-4 justify-center">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href={api.getDownloadUrl(jobId)}
                download
                className="px-8 py-4 rounded-lg accent-bg font-semibold text-lg hover:opacity-90 transition-opacity"
              >
                Download MP3
              </motion.a>
              <motion.button
                whileHover={{ scale: isSaved ? 1 : 1.05 }}
                whileTap={{ scale: isSaved ? 1 : 0.95 }}
                onClick={handleSave}
                disabled={isSaving || isSaved}
                className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all ${
                  isSaved
                    ? 'bg-green-500/20 border border-green-500/50 text-green-400 cursor-default'
                    : 'border border-white/10 hover:border-white/20'
                }`}
              >
                {isSaving ? 'Saving...' : isSaved ? 'Saved ✓' : 'Save to Library'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onReset}
                className="px-8 py-4 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
              >
                Create Another Junt
              </motion.button>
            </div>
          ) : (
            <div className="text-sm text-gray-400">
              You can start listening now. Full junt will be available when all tracks complete.
            </div>
          )}

          {status.errors && status.errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-left"
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

          {stillProcessing && status.track_statuses && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8"
            >
              <div className="text-sm font-semibold text-gray-400 mb-4">
                Track Progress
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
