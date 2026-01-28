import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AudioPlayer } from './AudioPlayer';
import { api } from '../lib/api';

export function PlaylistPlayer({ playlist, onBack }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => {
    loadPlaylistTracks();
  }, [playlist.id]);

  const loadPlaylistTracks = async () => {
    try {
      setLoading(true);
      const data = await api.getPlaylistTracks(playlist.id);
      setTracks(data.tracks || []);
    } catch (error) {
      console.error('Failed to load playlist tracks:', error);
      alert('Failed to load playlist tracks');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAudioEnded = () => {
    // Move to next track if available
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    } else {
      // Playlist finished
      console.log('Playlist finished');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full spinner" />
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-400 mb-4">This playlist is empty or has no valid tracks</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="px-6 py-3 rounded-lg accent-bg font-semibold hover:opacity-90 transition-opacity"
          >
            Back
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl text-center"
      >
        {/* Playlist info */}
        <div className="mb-8">
          <h2 className="text-5xl font-bold mb-4 tracking-tight">
            {playlist.name}
          </h2>
          {playlist.description && (
            <p className="text-gray-400 text-lg mb-4">
              {playlist.description}
            </p>
          )}
          <p className="text-sm text-gray-500">
            {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
          </p>
        </div>

        {/* Current track info */}
        {currentTrack && (
          <div className="mb-4 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Now Playing</p>
            <p className="text-lg font-semibold">{currentTrack.track_title}</p>
            <p className="text-sm text-gray-500 mt-1">
              {currentTrack.junt_artist} - {currentTrack.junt_title}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Track {currentTrackIndex + 1} of {tracks.length}
            </p>
          </div>
        )}

        {/* Audio player */}
        <div className="mb-8">
          {currentTrack && (
            <AudioPlayer
              key={`playlist-${playlist.id}-track-${currentTrackIndex}`}
              audioUrl={api.getTrackStreamUrl(currentTrack.junt_id, currentTrack.track_number)}
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
        <div className="mb-6 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg max-h-64 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Track List</h3>
          <div className="space-y-1">
            {tracks.map((track, index) => (
              <motion.button
                key={`${track.junt_id}-${track.track_number}`}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleTrackSelect(index)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  index === currentTrackIndex
                    ? 'bg-purple-500/20 border border-purple-500/30'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-6">{index + 1}</span>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{track.track_title}</div>
                    <div className="text-xs text-gray-500">
                      {track.junt_artist} - {track.junt_title}
                    </div>
                  </div>
                  {index === currentTrackIndex && (
                    <span className="text-xs text-purple-400">Playing</span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="px-8 py-4 rounded-lg accent-bg font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Back to Playlist
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
