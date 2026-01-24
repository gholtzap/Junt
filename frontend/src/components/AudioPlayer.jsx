import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';

export function AudioPlayer({ audioUrl, onUpgradeClick }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [hitLimit, setHitLimit] = useState(false);

  const isAnonymous = api.isAnonymous();
  const ANONYMOUS_LIMIT = 10; // seconds

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);

      // Enforce 10-second limit for anonymous users
      if (isAnonymous && time >= ANONYMOUS_LIMIT && !hitLimit) {
        audio.pause();
        setIsPlaying(false);
        setHitLimit(true);
        setShowUpgradePrompt(true);
      }
    };

    const handleLoadedMetadata = () => setDuration(audio.duration);

    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isAnonymous, hitLimit]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    let newTime = percentage * duration;

    // Prevent anonymous users from seeking past 10 seconds
    if (isAnonymous && newTime > ANONYMOUS_LIMIT) {
      newTime = ANONYMOUS_LIMIT;
      setShowUpgradePrompt(true);
    }

    audio.currentTime = newTime;
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const anonymousProgress = isAnonymous ? (ANONYMOUS_LIMIT / duration) * 100 : 100;

  return (
    <div className="w-full max-w-2xl relative">
      <audio ref={audioRef} src={audioUrl} />

      <div className="space-y-4">
        {/* Anonymous trial badge */}
        {isAnonymous && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-orange-500/10 backdrop-blur-md border border-orange-500/30 rounded-lg text-center"
          >
            <div className="text-sm text-orange-400 font-medium">
              Trial Mode: First {ANONYMOUS_LIMIT} seconds free
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Sign up to hear the full junt
            </div>
          </motion.div>
        )}

        {/* Play button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlay}
          disabled={hitLimit}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-opacity ${
            hitLimit
              ? 'bg-gray-600/30 backdrop-blur-md text-gray-400 cursor-not-allowed'
              : 'accent-bg text-white hover:opacity-90'
          }`}
        >
          {hitLimit ? 'Preview Complete' : isPlaying ? 'Pause' : 'Play Montage'}
        </motion.button>

        {/* Progress bar */}
        <div className="relative">
          <div
            onClick={handleSeek}
            className="h-2 bg-white/10 rounded-full cursor-pointer relative overflow-hidden"
          >
            <motion.div
              className="h-full accent-bg"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />

            {/* Anonymous limit marker */}
            {isAnonymous && duration > 0 && (
              <div
                className="absolute top-0 h-full w-0.5 bg-orange-400"
                style={{ left: `${anonymousProgress}%` }}
              />
            )}
          </div>
        </div>

        {/* Time display */}
        <div className="flex justify-between text-sm text-gray-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          {isAnonymous ? (
            <span className="text-orange-400">{formatTime(ANONYMOUS_LIMIT)} / {formatTime(duration)}</span>
          ) : (
            <span>{formatTime(duration)}</span>
          )}
        </div>
      </div>

      {/* Upgrade prompt modal */}
      <AnimatePresence>
        {showUpgradePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6"
            onClick={() => setShowUpgradePrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-md border border-white/10 rounded-xl p-8 max-w-md w-full text-center"
            >
              <h3 className="text-3xl font-bold mb-4">Want More?</h3>
              <p className="text-gray-300 mb-6">
                You've heard the first {ANONYMOUS_LIMIT} seconds. Sign up for free to hear the full junt and create unlimited montages!
              </p>

              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onUpgradeClick || (() => window.location.href = '/')}
                  className="w-full py-4 rounded-lg accent-bg text-white font-semibold text-lg hover:opacity-90 transition-opacity"
                >
                  Sign Up Free
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowUpgradePrompt(false)}
                  className="w-full py-3 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
