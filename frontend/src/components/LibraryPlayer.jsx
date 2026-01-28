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
    <div className="min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-7xl mx-auto"
      >
        {/* Auto-play notification */}
        {showAutoPlayNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="px-6 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-md border border-white/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>Auto-playing next junt...</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left side: Album art and info */}
          <div className="flex flex-col items-center lg:items-start">
            {montage.album.cover_url ? (
              <motion.img
                key={montage.id}
                src={montage.album.cover_url}
                alt={montage.album.title}
                className="w-full max-w-md rounded-lg object-cover mb-6 accent-glow-strong"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            ) : (
              <div className="w-full max-w-md aspect-square rounded-lg bg-white/5 backdrop-blur-md mb-6 flex items-center justify-center text-sm text-gray-600">
                No Cover
              </div>
            )}

            <div className="w-full max-w-md">
              <motion.h2
                key={`title-${montage.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-4xl font-bold mb-2 tracking-tight"
              >
                {montage.album.title}
              </motion.h2>
              <p className="text-gray-400 text-xl mb-3">
                {montage.album.artist}
              </p>
              {montage.album.year && (
                <p className="text-sm text-gray-500 mb-3">{montage.album.year}</p>
              )}
              <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-4">
                <span>{tracks.length} tracks</span>
                <span>•</span>
                <span>{formatDuration(montage.duration_type)}</span>
              </div>
              <p className="text-xs text-gray-600">
                Saved on {new Date(montage.created_at).toLocaleDateString()}
              </p>

              {/* Auto-play info */}
              {allMontages.length > 1 && (
                <div className="mt-6 p-3 bg-blue-500/10 backdrop-blur-md border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                    </svg>
                    <span>Auto-play enabled</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onBack}
                  className="flex-1 px-6 py-3 rounded-lg accent-bg font-semibold hover:opacity-90 transition-opacity"
                >
                  Back to Library
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDelete}
                  className="px-6 py-3 rounded-lg bg-red-500/10 backdrop-blur-md border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-colors"
                >
                  Delete
                </motion.button>
              </div>
            </div>
          </div>

          {/* Right side: Player and controls */}
          <div className="flex flex-col">
            {/* Current track info */}
            {currentTrack && (
              <div className="mb-6 p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Now Playing</p>
                <p className="text-2xl font-bold mb-2">
                  {currentTrack.title}
                </p>
                <p className="text-sm text-gray-400">
                  Track {currentTrack.number} • {currentTrackIndex + 1} of {tracks.length}
                </p>
              </div>
            )}

            {/* Audio player */}
            <div className="mb-6">
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
              <div className="flex gap-3 mb-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePreviousTrack}
                  disabled={currentTrackIndex === 0}
                  className="flex-1 px-6 py-3 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                >
                  ← Previous
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextTrack}
                  disabled={currentTrackIndex === tracks.length - 1}
                  className="flex-1 px-6 py-3 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                >
                  Next →
                </motion.button>
              </div>
            )}

            {/* Track list */}
            {tracks.length > 0 && (
              <div className="flex-1 p-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden flex flex-col">
                <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Tracks</h3>
                <div className="space-y-1 overflow-y-auto pr-2">
                  {tracks.map((track, index) => (
                    <div key={track.number} className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        onClick={() => handleTrackSelect(index)}
                        className={`flex-1 text-left px-3 py-3 rounded-lg transition-colors ${
                          index === currentTrackIndex
                            ? 'bg-purple-500/20 border border-purple-500/30'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500 font-mono w-8">{track.number}</span>
                          <span className="flex-1 text-sm font-medium">{track.title}</span>
                          {index === currentTrackIndex && (
                            <span className="text-xs text-purple-400 font-semibold">Playing</span>
                          )}
                        </div>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => handleAddTrackToPlaylist(track.number, e)}
                        className="px-3 py-3 rounded-lg bg-purple-500/10 backdrop-blur-md border border-purple-500/30 hover:border-purple-500/50 transition-colors"
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
          </div>
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
