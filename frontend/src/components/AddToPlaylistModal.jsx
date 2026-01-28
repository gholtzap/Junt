import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

export function AddToPlaylistModal({
  isOpen,
  onClose,
  juntId,
  trackNumber = null
}) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadPlaylists();
    }
  }, [isOpen]);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const data = await api.getPlaylists();
      setPlaylists(data.playlists || []);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (playlistId) => {
    if (adding) return;

    try {
      setAdding(true);
      setSelectedPlaylistId(playlistId);

      if (trackNumber !== null) {
        // Add specific track
        await api.addTrackToPlaylist(playlistId, juntId, trackNumber);
      } else {
        // Add entire junt
        await api.addJuntToPlaylist(playlistId, juntId);
      }

      onClose();
    } catch (error) {
      console.error('Failed to add to playlist:', error);
      alert('Failed to add to playlist');
    } finally {
      setAdding(false);
      setSelectedPlaylistId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-white/10"
      >
        <h2 className="text-2xl font-bold mb-4">
          Add to Playlist
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          {trackNumber !== null
            ? `Adding track ${trackNumber}`
            : 'Adding entire junt'}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full spinner" />
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No playlists yet</p>
            <p className="text-sm text-gray-500">
              Create a playlist first to add items to it
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
            {playlists.map((playlist) => (
              <motion.button
                key={playlist.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAdd(playlist.id)}
                disabled={adding}
                className="w-full p-4 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{playlist.name}</div>
                    {playlist.description && (
                      <div className="text-xs text-gray-500 mt-1">{playlist.description}</div>
                    )}
                    <div className="text-xs text-gray-600 mt-1">
                      {playlist.items?.length || 0} items
                    </div>
                  </div>
                  {adding && selectedPlaylistId === playlist.id && (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full spinner" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          disabled={adding}
          className="w-full px-6 py-3 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </motion.button>
      </motion.div>
    </div>
  );
}
