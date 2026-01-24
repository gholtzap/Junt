import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

export function AlbumSearch({ onSelectAlbum }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await api.searchAlbums(query);
        setResults(data.albums);
      } catch (err) {
        setError('Failed to search albums. Please try again.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 tracking-tight">
            Junt
          </h1>
          <p className="text-gray-400 text-lg">
            Find your favorite track without hitting skip.
          </p>
        </div>

        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for an album..."
            className="w-full px-6 py-5 rounded-lg text-lg focus:ring-2 focus:ring-white/20"
            autoFocus
          />

          {loading && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full spinner" />
            </div>
          )}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400"
          >
            {error}
          </motion.div>
        )}

        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 space-y-3 max-h-96 overflow-y-auto"
          >
            {results.map((album) => (
              <motion.button
                key={album.mbid}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectAlbum(album.mbid)}
                className="w-full p-4 bg-dark-surface rounded-lg border border-white/10 hover:border-white/20 text-left flex items-center gap-4 transition-all"
              >
                {album.cover_url && (
                  <img
                    src={album.cover_url}
                    alt={album.title}
                    className="w-16 h-16 rounded object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1">
                  <div className="font-semibold text-lg">{album.title}</div>
                  <div className="text-gray-400">{album.artist}</div>
                  {album.year && (
                    <div className="text-sm text-gray-500">{album.year}</div>
                  )}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
