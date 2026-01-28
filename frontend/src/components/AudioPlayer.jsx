import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function AudioPlayer({ audioUrl, onEnded }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Auto-play when audioUrl changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reset and auto-play when URL changes
    audio.load();
    audio.play()
      .then(() => setIsPlaying(true))
      .catch(err => {
        console.log('Auto-play prevented:', err);
        setIsPlaying(false);
      });
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => setDuration(audio.duration);

    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) {
        onEnded();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onEnded]);

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
    const newTime = percentage * duration;

    audio.currentTime = newTime;
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full max-w-2xl relative">
      <audio ref={audioRef} src={audioUrl} />

      <div className="space-y-4">
        {/* Play button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlay}
          className="w-full py-4 rounded-lg font-semibold text-lg accent-bg text-white hover:opacity-90 transition-opacity"
        >
          {isPlaying ? 'Pause' : 'Play Montage'}
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
          </div>
        </div>

        {/* Time display */}
        <div className="flex justify-between text-sm text-gray-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
