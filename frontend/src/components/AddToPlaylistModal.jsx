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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPlaylists();
      // Reset form state when modal opens
      setShowCreateForm(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
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

  const handleCreateAndAdd = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || creating) return;

    try {
      setCreating(true);

      // Create the playlist
      const newPlaylist = await api.createPlaylist(newPlaylistName, newPlaylistDescription);

      // Add the track/junt to it
      if (trackNumber !== null) {
        await api.addTrackToPlaylist(newPlaylist.id, juntId, trackNumber);
      } else {
        await api.addJuntToPlaylist(newPlaylist.id, juntId);
      }

      // Close the modal
      onClose();
    } catch (error) {
      console.error('Failed to create playlist and add item:', error);
      alert('Failed to create playlist');
    } finally {
      setCreating(false);
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
        ) : showCreateForm ? (
          <form onSubmit={handleCreateAndAdd} className="mb-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Playlist Name</label>
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 outline-none"
                placeholder="My Awesome Playlist"
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Description (optional)</label>
              <textarea
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 outline-none resize-none"
                placeholder="A collection of my favorite tracks"
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!newPlaylistName.trim() || creating}
                className="flex-1 px-6 py-3 rounded-lg accent-bg font-semibold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create & Add'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewPlaylistName('');
                  setNewPlaylistDescription('');
                }}
                disabled={creating}
                className="px-6 py-3 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Back
              </motion.button>
            </div>
          </form>
        ) : playlists.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No playlists yet</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 rounded-lg accent-bg font-semibold hover:opacity-90 transition-opacity"
            >
              Create Playlist
            </motion.button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateForm(true)}
                className="w-full p-4 rounded-lg bg-purple-500/10 backdrop-blur-md border border-purple-500/30 hover:border-purple-500/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-purple-400"
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
                  </div>
                  <div>
                    <div className="font-semibold text-purple-400">Create New Playlist</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Create a playlist and add this {trackNumber !== null ? 'track' : 'junt'}
                    </div>
                  </div>
                </div>
              </motion.button>
            </div>
            <div className="text-xs text-gray-500 mb-2 px-1">Or add to existing playlist:</div>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
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
          </>
        )}

        {!showCreateForm && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            disabled={adding}
            className="w-full px-6 py-3 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
