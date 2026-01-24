import { motion } from 'framer-motion';

export function DurationSelect({ onSelect, trackCount, onBack }) {
  const presets = [
    {
      id: 'short',
      name: 'Short',
      clipDuration: 6,
      crossfade: 0.3,
      description: 'Quick preview',
    },
    {
      id: 'medium',
      name: 'Medium',
      clipDuration: 11,
      crossfade: 0.5,
      description: 'Balanced length',
    },
    {
      id: 'long',
      name: 'Long',
      clipDuration: 21,
      crossfade: 0.75,
      description: 'Extended preview',
    },
  ];

  const calculateTotal = (clipDuration, crossfade) => {
    const total = trackCount * clipDuration - (trackCount - 1) * crossfade;
    const minutes = Math.floor(total / 60);
    const seconds = Math.floor(total % 60);
    return `~${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-12">
          {onBack && (
            <button
              onClick={onBack}
              className="mb-6 px-6 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg hover:border-white/30 transition-colors text-gray-400 hover:text-white"
            >
              ← Back
            </button>
          )}
          <h2 className="text-4xl font-bold mb-4 tracking-tight">
            Choose Duration
          </h2>
          <p className="text-gray-400 text-lg">
            Select the clip length for your junt
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {presets.map((preset, index) => (
            <motion.button
              key={preset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(preset.id)}
              className="p-8 bg-dark-surface backdrop-blur-md rounded-lg border border-white/10 hover:border-white/30 transition-all text-left"
            >
              <div className="text-3xl font-bold mb-2 accent-color">
                {preset.name}
              </div>
              <div className="text-gray-400 mb-4">{preset.description}</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Clip length:</span>
                  <span className="font-mono">{preset.clipDuration}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Crossfade:</span>
                  <span className="font-mono">{preset.crossfade}s</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/5">
                  <span className="text-gray-500">Total time:</span>
                  <span className="font-mono font-semibold">
                    {calculateTotal(preset.clipDuration, preset.crossfade)}
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
