import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

export function Library({ onSelectMontage, onBack }) {
  const [montages, setMontages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      setLoading(true);
      const data = await api.getLibrary();
      setMontages(data.montages);
      setError(null);
    } catch (err) {
      console.error('Failed to load library:', err);
      setError('Failed to load library');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (montageId, e) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this junt?')) {
      return;
    }

    try {
      await api.deleteMontage(montageId);
      setMontages(montages.filter(m => m.id !== montageId));
    } catch (err) {
      console.error('Failed to delete montage:', err);
      alert('Failed to delete junt');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadLibrary}
            className="px-6 py-3 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold tracking-tight">My Library</h1>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
          >
            Back to Search
          </button>
        </div>

        {montages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🎵</div>
            <h2 className="text-2xl font-semibold mb-2 text-gray-400">
              No saved junts yet
            </h2>
            <p className="text-gray-500 mb-6">
              Find your favorite track without hitting skip
            </p>
            <button
              onClick={onBack}
              className="px-8 py-4 rounded-lg accent-bg font-semibold hover:opacity-90 transition-opacity"
            >
              Create Junt
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {montages.map((montage, index) => (
              <motion.div
                key={montage.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectMontage(montage)}
                className="group cursor-pointer"
              >
                <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-white/5">
                  {montage.album.cover_url ? (
                    <img
                      src={montage.album.cover_url}
                      alt={montage.album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-600">
                      🎵
                    </div>
                  )}

                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white ml-1"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(montage.id, e)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <h3 className="font-semibold text-sm mb-1 truncate group-hover:text-white transition-colors">
                  {montage.album.title}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {montage.album.artist}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(montage.created_at).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
