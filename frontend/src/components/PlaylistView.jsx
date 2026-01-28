import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

export function PlaylistView({ playlistId, onBack, onPlay }) {
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    loadPlaylist();
  }, [playlistId]);

  const loadPlaylist = async () => {
    try {
      setLoading(true);
      const data = await api.getPlaylist(playlistId);
      setPlaylist(data);
      setEditName(data.name);
      setEditDescription(data.description || '');
    } catch (error) {
      console.error('Failed to load playlist:', error);
      alert('Failed to load playlist');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.updatePlaylist(playlistId, editName, editDescription);
      setEditing(false);
      await loadPlaylist();
    } catch (error) {
      console.error('Failed to update playlist:', error);
      alert('Failed to update playlist');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this playlist?')) {
      return;
    }

    try {
      await api.deletePlaylist(playlistId);
      onBack();
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      alert('Failed to delete playlist');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await api.removeItemFromPlaylist(playlistId, itemId);
      await loadPlaylist();
    } catch (error) {
      console.error('Failed to remove item:', error);
      alert('Failed to remove item');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full spinner" />
      </div>
    );
  }

  if (!playlist) {
    return null;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {editing ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full text-4xl font-bold bg-transparent border-b-2 border-white/20 focus:border-white/50 outline-none pb-2"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full text-gray-400 bg-white/5 border border-white/10 focus:border-white/30 outline-none rounded-lg px-4 py-2 resize-none"
                placeholder="Add a description..."
                rows={2}
              />
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUpdate}
                  className="px-4 py-2 rounded-lg accent-bg font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Save
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setEditing(false);
                    setEditName(playlist.name);
                    setEditDescription(playlist.description || '');
                  }}
                  className="px-4 py-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors text-sm"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-bold mb-2">{playlist.name}</h1>
              {playlist.description && (
                <p className="text-gray-400 mb-4">{playlist.description}</p>
              )}
              <div className="text-sm text-gray-500 mb-4">
                {playlist.items?.length || 0} {playlist.items?.length === 1 ? 'item' : 'items'} •
                Updated {new Date(playlist.updated_at).toLocaleDateString()}
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onPlay(playlist)}
                  disabled={!playlist.items || playlist.items.length === 0}
                  className="px-6 py-3 rounded-lg accent-bg font-semibold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Play
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditing(true)}
                  className="px-4 py-3 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors"
                >
                  Edit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDelete}
                  className="px-4 py-3 rounded-lg bg-red-500/10 backdrop-blur-md border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-colors"
                >
                  Delete
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
            </>
          )}
        </div>

        {/* Items list */}
        {!playlist.items || playlist.items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">This playlist is empty</p>
            <p className="text-sm text-gray-500">
              Add tracks or junts from your library
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {playlist.items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 w-8">{index + 1}</span>
                      <div>
                        <div className="font-medium">
                          {item.type === 'track' ? (
                            <>Track {item.track_number}</>
                          ) : (
                            <>Full Junt</>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          Junt ID: {item.junt_id.slice(0, 8)}...
                        </div>
                        <div className="text-xs text-gray-600">
                          Added {new Date(item.added_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRemoveItem(item.id)}
                    className="px-3 py-2 rounded-lg bg-red-500/10 backdrop-blur-md border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-colors text-sm"
                  >
                    Remove
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
