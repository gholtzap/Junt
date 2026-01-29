import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';

export function BrowseJuntsModal({ isOpen, onClose, playlistId, onAdded }) {
  const [junts, setJunts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJunt, setSelectedJunt] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadJunts();
      setSelectedJunt(null);
    }
  }, [isOpen]);

  const loadJunts = async () => {
    try {
      setLoading(true);
      const library = await api.getLibrary();
      setJunts(library.montages || []);
    } catch (error) {
      console.error('Failed to load library:', error);
      alert('Failed to load junts from library');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFullJunt = async (junt) => {
    try {
      setAdding(true);
      await api.addJuntToPlaylist(playlistId, junt.id);
      onAdded();
      onClose();
    } catch (error) {
      console.error('Failed to add junt:', error);
      alert('Failed to add junt to playlist');
    } finally {
      setAdding(false);
    }
  };

  const handleAddTrack = async (junt, trackNumber) => {
    try {
      setAdding(true);
      await api.addTrackToPlaylist(playlistId, junt.id, trackNumber);
      onAdded();
      onClose();
    } catch (error) {
      console.error('Failed to add track:', error);
      alert('Failed to add track to playlist');
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Add Junt to Playlist</h2>
          <p className="text-gray-400 text-sm">
            {selectedJunt ? 'Choose what to add' : 'Select a junt from your library'}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full spinner" />
            </div>
          ) : selectedJunt ? (
            // Track selection view
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedJunt(null)}
                className="text-sm text-gray-400 hover:text-white transition-colors mb-4"
              >
                ← Back to junts
              </motion.button>

              {/* Add full junt option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAddFullJunt(selectedJunt)}
                disabled={adding}
                className="w-full p-4 rounded-lg bg-purple-500/20 border border-purple-500/50 hover:border-purple-400 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-purple-300">Add Full Junt</div>
                    <div className="text-sm text-gray-400 mt-1">
                      All {selectedJunt.tracks?.length || 0} tracks
                    </div>
                  </div>
                  {adding && (
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full spinner" />
                  )}
                </div>
              </motion.button>

              {/* Individual tracks */}
              <div className="space-y-2">
                <div className="text-sm text-gray-400 mb-2">Or add individual track:</div>
                {selectedJunt.tracks?.map((track, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleAddTrack(selectedJunt, index + 1)}
                    disabled={adding}
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/30 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{track.title}</div>
                        <div className="text-sm text-gray-400">Track {index + 1}</div>
                      </div>
                      {adding && (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full spinner" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : junts.length === 0 ? (
            // Empty state
            <div className="text-center py-20">
              <p className="text-gray-400 mb-2">No junts in your library</p>
              <p className="text-sm text-gray-500">Create some junts first</p>
            </div>
          ) : (
            // Junt list
            <div className="space-y-2">
              {junts.map((junt) => (
                <motion.button
                  key={junt.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedJunt(junt)}
                  className="w-full p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/30 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold mb-1">
                        {junt.album?.title || 'Unknown Album'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {junt.album?.artist || 'Unknown Artist'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {junt.tracks?.length || 0} tracks • {junt.duration_type || 'Unknown'} duration
                      </div>
                    </div>
                    <div className="text-gray-400">→</div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            disabled={adding}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
