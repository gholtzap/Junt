import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { LoadingScreen } from './LoadingScreen';

export function AlbumConfirm({ mbid, onConfirm, onBack }) {
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAlbum();
  }, [mbid]);

  const loadAlbum = async () => {
    try {
      const data = await api.getAlbumDetails(mbid);
      setAlbum(data);
    } catch (err) {
      setError('Failed to load album details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading album details..." />;
  }

  if (error || !album) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Error Loading Album</h2>
          <p className="text-red-400 mb-6">{error || 'Album not found'}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="px-6 py-3 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors"
          >
            ← Back to Search
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="flex flex-col md:flex-row gap-8">
          {/* Album artwork */}
          <div className="flex-shrink-0">
            <motion.img
              src={album.cover_url}
              alt={album.title}
              className="w-80 h-80 rounded-lg object-cover accent-glow"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Album details */}
          <div className="flex-1 flex flex-col">
            <div className="mb-6">
              <h2 className="text-4xl font-bold mb-2 tracking-tight">
                {album.title}
              </h2>
              <p className="text-2xl text-gray-400">{album.artist}</p>
              {album.year && (
                <p className="text-lg text-gray-500 mt-1">{album.year}</p>
              )}
            </div>

            {/* Tracklist */}
            <div className="flex-1 mb-6">
              <h3 className="text-sm uppercase text-gray-500 font-semibold tracking-wide mb-3">
                Tracklist ({album.tracks.length} tracks)
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-1 pr-2">
                {album.tracks.map((track) => (
                  <div
                    key={track.number}
                    className="flex items-center gap-3 py-1.5 text-sm"
                  >
                    <span className="text-gray-500 font-mono w-6 text-right">
                      {track.number}
                    </span>
                    <span className="flex-1">{track.title}</span>
                    {track.duration && (
                      <span className="text-gray-500 font-mono">
                        {Math.floor(track.duration / 60)}:
                        {(track.duration % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onBack}
                className="px-6 py-3 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors"
              >
                Back
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                className="flex-1 px-6 py-3 rounded-lg accent-bg font-semibold hover:opacity-90 transition-opacity"
              >
                Create Junt →
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
