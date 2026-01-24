import { motion } from 'framer-motion';
import { AudioPlayer } from './AudioPlayer';
import { api } from '../lib/api';

export function LibraryPlayer({ montage, onBack, onDelete }) {
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

  const formatDuration = (durationType) => {
    const durations = {
      short: 'Short (15s per track)',
      medium: 'Medium (30s per track)',
      long: 'Long (45s per track)',
    };
    return durations[durationType] || durationType;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl text-center"
      >
        {/* Album art */}
        <div className="mb-8">
          {montage.album.cover_url ? (
            <motion.img
              src={montage.album.cover_url}
              alt={montage.album.title}
              className="w-64 h-64 rounded-lg object-cover mx-auto mb-6 accent-glow-strong"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            />
          ) : (
            <div className="w-64 h-64 rounded-lg bg-white/5 backdrop-blur-md mx-auto mb-6 flex items-center justify-center text-sm text-gray-600">
              No Cover
            </div>
          )}

          <h2 className="text-5xl font-bold mb-4 tracking-tight">
            {montage.album.title}
          </h2>
          <p className="text-gray-400 text-lg mb-2">
            {montage.album.artist}
          </p>
          {montage.album.year && (
            <p className="text-sm text-gray-500 mb-2">{montage.album.year}</p>
          )}
          <p className="text-sm text-gray-500">
            {montage.track_count} tracks • {formatDuration(montage.duration_type)}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Saved on {new Date(montage.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Audio player */}
        <div className="mb-8">
          <AudioPlayer audioUrl={api.getLibraryStreamUrl(montage.id)} />
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="px-8 py-4 rounded-lg accent-bg font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Back to Library
          </motion.button>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={api.getLibraryStreamUrl(montage.id)}
            download={`${montage.album.artist} - ${montage.album.title}.mp3`}
            className="px-8 py-4 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors inline-block"
          >
            Download
          </motion.a>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            className="px-8 py-4 rounded-lg bg-red-500/10 backdrop-blur-md border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-colors"
          >
            Delete
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
