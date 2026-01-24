import { motion } from 'framer-motion';

export function TrackProgress({ trackStatus }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return 'OK';
      case 'failed':
        return 'X';
      case 'downloading':
      case 'analyzing':
        return 'O';
      default:
        return '-';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400 line-through';
      case 'downloading':
        return 'accent-color animate-pulse';
      case 'analyzing':
        return 'text-purple-400 animate-pulse';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 py-2 px-4 rounded bg-white/5 backdrop-blur-sm border border-white/10 ${getStatusColor(trackStatus.status)}`}
    >
      <span className="text-lg font-mono w-6 text-center">
        {getStatusIcon(trackStatus.status)}
      </span>
      <div className="flex-1">
        <div className="font-medium">
          {trackStatus.track_number}. {trackStatus.track_title}
        </div>
        {trackStatus.error && (
          <div className="text-sm text-red-400 mt-1">{trackStatus.error}</div>
        )}
      </div>
      {trackStatus.status === 'downloading' && (
        <span className="text-sm text-gray-400">Downloading...</span>
      )}
      {trackStatus.status === 'analyzing' && (
        <span className="text-sm text-gray-400">Analyzing...</span>
      )}
    </motion.div>
  );
}
