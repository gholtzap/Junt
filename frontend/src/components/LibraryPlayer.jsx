import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AudioPlayer } from './AudioPlayer';
import { api } from '../lib/api';

export function LibraryPlayer({ montage, onBack, onDelete, onAutoPlay }) {
  const [allMontages, setAllMontages] = useState([]);
  const [showAutoPlayNotice, setShowAutoPlayNotice] = useState(false);

  useEffect(() => {
    // Fetch all montages for auto-play
    const loadMontages = async () => {
      try {
        const data = await api.getLibrary();
        setAllMontages(data.montages);
      } catch (error) {
        console.error('Failed to load library for auto-play:', error);
      }
    };
    loadMontages();
  }, []);

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

  const handleAudioEnded = () => {
    // Filter out current montage
    const availableMontages = allMontages.filter(m => m.id !== montage.id);

    if (availableMontages.length === 0) {
      console.log('No other montages available for auto-play');
      return;
    }

    // Pick random montage
    const randomIndex = Math.floor(Math.random() * availableMontages.length);
    const nextMontage = availableMontages[randomIndex];

    // Show brief notification
    setShowAutoPlayNotice(true);
    setTimeout(() => setShowAutoPlayNotice(false), 3000);

    // Auto-play next montage
    if (onAutoPlay) {
      onAutoPlay(nextMontage);
    }
  };

  const formatDuration = (durationType) => {
    const durations = {
      short: 'Short (10% per track)',
      medium: 'Medium (20% per track)',
      long: 'Long (30% per track)',
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
        {/* Auto-play notification */}
        {showAutoPlayNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="px-6 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-md border border-white/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>Auto-playing next junt...</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Album art */}
        <div className="mb-8">
          {montage.album.cover_url ? (
            <motion.img
              key={montage.id}
              src={montage.album.cover_url}
              alt={montage.album.title}
              className="w-64 h-64 rounded-lg object-cover mx-auto mb-6 accent-glow-strong"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          ) : (
            <div className="w-64 h-64 rounded-lg bg-white/5 backdrop-blur-md mx-auto mb-6 flex items-center justify-center text-sm text-gray-600">
              No Cover
            </div>
          )}

          <motion.h2
            key={`title-${montage.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-5xl font-bold mb-4 tracking-tight"
          >
            {montage.album.title}
          </motion.h2>
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
          <AudioPlayer
            audioUrl={api.getLibraryStreamUrl(montage.id)}
            onEnded={handleAudioEnded}
          />
        </div>

        {/* Auto-play info */}
        {allMontages.length > 1 && (
          <div className="mb-6 p-3 bg-blue-500/10 backdrop-blur-md border border-blue-500/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-blue-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
              </svg>
              <span>Auto-play enabled • Next junt plays automatically</span>
            </div>
          </div>
        )}

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
