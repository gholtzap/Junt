import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AudioPlayer } from './AudioPlayer';
import { api } from '../lib/api';
import { AddToPlaylistModal } from './AddToPlaylistModal';

export function LibraryPlayer({ montage, onBack, onDelete, onAutoPlay }) {
  const [allMontages, setAllMontages] = useState([]);
  const [showAutoPlayNotice, setShowAutoPlayNotice] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [selectedTrackNumber, setSelectedTrackNumber] = useState(null);

  const tracks = montage.tracks || [];
  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => {
    // Fetch all montages for auto-play
    const loadMontages = async () => {
      try {
        const data = await api.getLibrary();
        setAllMontages(data.montages);
      } catch (error) {
        console.error('Failed to load library for auto-play:', error);
      }
    };
    loadMontages();
  }, []);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this junt?')) {
      return;
    }

    try {
      await api.deleteMontage(montage.id);
      onDelete();
    } catch (error) {
      console.error('Failed to delete montage:', error);
      alert('Failed to delete junt');
    }
  };

  const handleAudioEnded = () => {
    // If there are more tracks, play the next one
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
      return;
    }

    // All tracks finished - auto-play next montage
    const availableMontages = allMontages.filter(m => m.id !== montage.id);

    if (availableMontages.length === 0) {
      console.log('No other montages available for auto-play');
      return;
    }

    // Pick random montage
    const randomIndex = Math.floor(Math.random() * availableMontages.length);
    const nextMontage = availableMontages[randomIndex];

    // Show brief notification
    setShowAutoPlayNotice(true);
    setTimeout(() => setShowAutoPlayNotice(false), 3000);

    // Auto-play next montage
    if (onAutoPlay) {
      onAutoPlay(nextMontage);
    }
  };

  const handleNextTrack = () => {
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    }
  };

  const handlePreviousTrack = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  const handleTrackSelect = (index) => {
    setCurrentTrackIndex(index);
  };

  const handleAddTrackToPlaylist = (trackNumber, e) => {
    e.stopPropagation();
    setSelectedTrackNumber(trackNumber);
    setShowAddToPlaylistModal(true);
  };

  const formatDuration = (durationType) => {
    const durations = {
      short: 'Short (10% per track)',
      medium: 'Medium (20% per track)',
      long: 'Long (30% per track)',
    };
    return durations[durationType] || durationType;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl text-center"
      >
        {/* Auto-play notification */}
        {showAutoPlayNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="px-6 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-md border border-white/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>Auto-playing next junt...</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Album art */}
        <div className="mb-8">
          {montage.album.cover_url ? (
            <motion.img
              key={montage.id}
              src={montage.album.cover_url}
              alt={montage.album.title}
              className="w-64 h-64 rounded-lg object-cover mx-auto mb-6 accent-glow-strong"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          ) : (
            <div className="w-64 h-64 rounded-lg bg-white/5 backdrop-blur-md mx-auto mb-6 flex items-center justify-center text-sm text-gray-600">
              No Cover
            </div>
          )}

          <motion.h2
            key={`title-${montage.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-5xl font-bold mb-4 tracking-tight"
          >
            {montage.album.title}
          </motion.h2>
          <p className="text-gray-400 text-lg mb-2">
            {montage.album.artist}
          </p>
          {montage.album.year && (
            <p className="text-sm text-gray-500 mb-2">{montage.album.year}</p>
          )}
          <p className="text-sm text-gray-500">
            {tracks.length} tracks • {formatDuration(montage.duration_type)}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Saved on {new Date(montage.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Current track info */}
        {currentTrack && (
          <div className="mb-4 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Now Playing</p>
            <p className="text-lg font-semibold">
              {currentTrack.number}. {currentTrack.title}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Track {currentTrackIndex + 1} of {tracks.length}
            </p>
          </div>
        )}

        {/* Audio player */}
        <div className="mb-8">
          {currentTrack && (
            <AudioPlayer
              key={`${montage.id}-track-${currentTrack.number}`}
              audioUrl={api.getTrackStreamUrl(montage.id, currentTrack.number)}
              onEnded={handleAudioEnded}
            />
          )}
        </div>

        {/* Track navigation */}
        {tracks.length > 1 && (
          <div className="mb-6 flex gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePreviousTrack}
              disabled={currentTrackIndex === 0}
              className="px-6 py-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Previous
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextTrack}
              disabled={currentTrackIndex === tracks.length - 1}
              className="px-6 py-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </motion.button>
          </div>
        )}

        {/* Track list */}
        {tracks.length > 0 && (
          <div className="mb-6 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg max-h-64 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Track List</h3>
            <div className="space-y-1">
              {tracks.map((track, index) => (
                <div key={track.number} className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleTrackSelect(index)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg transition-colors ${
                      index === currentTrackIndex
                        ? 'bg-purple-500/20 border border-purple-500/30'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 w-6">{track.number}</span>
                      <span className="flex-1 text-sm">{track.title}</span>
                      {index === currentTrackIndex && (
                        <span className="text-xs text-purple-400">Playing</span>
                      )}
                    </div>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleAddTrackToPlaylist(track.number, e)}
                    className="px-2 py-2 rounded-lg bg-purple-500/10 backdrop-blur-md border border-purple-500/30 hover:border-purple-500/50 transition-colors"
                    title="Add to Playlist"
                  >
                    <svg
                      className="w-4 h-4 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </motion.button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auto-play info */}
        {allMontages.length > 1 && (
          <div className="mb-6 p-3 bg-blue-500/10 backdrop-blur-md border border-blue-500/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-blue-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
              </svg>
              <span>Auto-play enabled • Next junt plays automatically</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="px-8 py-4 rounded-lg accent-bg font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Back to Library
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            className="px-8 py-4 rounded-lg bg-red-500/10 backdrop-blur-md border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-colors"
          >
            Delete
          </motion.button>
        </div>
      </motion.div>

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={showAddToPlaylistModal}
        onClose={() => {
          setShowAddToPlaylistModal(false);
          setSelectedTrackNumber(null);
        }}
        juntId={montage.id}
        trackNumber={selectedTrackNumber}
      />
    </div>
  );
}
