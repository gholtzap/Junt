import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

export function PlaylistList({ onSelectPlaylist, onBack }) {
  const [playlists, setPlaylists] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadPlaylists(currentPage);
  }, [currentPage]);

  const loadPlaylists = async (page = 1) => {
    try {
      setLoading(true);
      const data = await api.getPlaylists(page, 20);
      setPlaylists(data.items || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || creating) return;

    try {
      setCreating(true);
      await api.createPlaylist(newPlaylistName, newPlaylistDescription);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setShowCreateModal(false);
      setCurrentPage(1);
      await loadPlaylists(1);
    } catch (error) {
      console.error('Failed to create playlist:', error);
      alert('Failed to create playlist');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Playlists</h1>
            <p className="text-gray-400">
              {pagination ? `${pagination.total} total` : `${playlists.length}`} {(pagination?.total === 1 || playlists.length === 1) ? 'playlist' : 'playlists'}
            </p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 rounded-lg accent-bg font-semibold hover:opacity-90 transition-opacity"
            >
              + New Playlist
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="px-6 py-3 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors"
            >
              Back
            </motion.button>
          </div>
        </div>

        {/* Playlists grid */}
        {playlists.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">No playlists yet</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 rounded-lg accent-bg font-semibold hover:opacity-90 transition-opacity"
            >
              Create Your First Playlist
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((playlist) => (
              <motion.div
                key={playlist.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => onSelectPlaylist(playlist)}
                className="p-6 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
              >
                <h3 className="text-xl font-semibold mb-2">{playlist.name}</h3>
                {playlist.description && (
                  <p className="text-sm text-gray-400 mb-3">{playlist.description}</p>
                )}
                <div className="text-xs text-gray-500">
                  {playlist.items?.length || 0} {playlist.items?.length === 1 ? 'item' : 'items'}
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  Created {new Date(playlist.created_at).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {pagination && pagination.total_pages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={!pagination.has_previous}
              className="px-4 py-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={!pagination.has_next}
              className="px-4 py-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Create playlist modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-white/10"
          >
            <h2 className="text-2xl font-bold mb-4">Create Playlist</h2>
            <form onSubmit={handleCreatePlaylist}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 outline-none"
                  placeholder="My Awesome Playlist"
                  autoFocus
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Description (optional)</label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 outline-none resize-none"
                  placeholder="A collection of my favorite tracks"
                  rows={3}
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
                  {creating ? 'Creating...' : 'Create'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewPlaylistName('');
                    setNewPlaylistDescription('');
                  }}
                  className="px-6 py-3 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
