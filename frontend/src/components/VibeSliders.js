import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, RotateCcw, Shuffle } from 'lucide-react';
import './VibeSliders.css';

const VibeSliders = ({ vibes, onVibesChange, onPresetSelect, compact = false }) => {
  const [showDescriptions, setShowDescriptions] = useState(!compact);
  const [showAllPresets, setShowAllPresets] = useState(false);

  const sliderConfig = [
    { key: 'humor', label: 'Humor', color: '#fbbf24', description: 'From deadpan to hilarious' },
    { key: 'romance', label: 'Romance', color: '#f472b6', description: 'From platonic to deeply romantic' },
    { key: 'energy', label: 'Energy', color: '#fb7185', description: 'From calm to high-energy' },
    { key: 'formality', label: 'Formality', color: '#60a5fa', description: 'From casual to professional' },
    { key: 'sarcasm', label: 'Sarcasm', color: '#a78bfa', description: 'From genuine to sarcastic' },
    { key: 'poeticism', label: 'Poeticism', color: '#34d399', description: 'From straightforward to lyrical' }
  ];

  const allPresets = [
    { name: 'Funny', vibes: { humor: 80, energy: 60, formality: 10, romance: 10, sarcasm: 30, poeticism: 20 } },
    { name: 'Romantic', vibes: { humor: 20, energy: 40, formality: 30, romance: 85, sarcasm: 5, poeticism: 60 } },
    { name: 'Motivational', vibes: { humor: 30, energy: 90, formality: 50, romance: 20, sarcasm: 10, poeticism: 40 } },
    { name: 'Business', vibes: { humor: 20, energy: 50, formality: 85, romance: 10, sarcasm: 15, poeticism: 30 } },
    { name: 'Witty', vibes: { humor: 60, energy: 40, formality: 20, romance: 15, sarcasm: 80, poeticism: 25 } },
    { name: 'Artistic', vibes: { humor: 25, energy: 40, formality: 30, romance: 30, sarcasm: 10, poeticism: 85 } },
    { name: 'Balanced', vibes: { humor: 30, energy: 50, formality: 30, romance: 20, sarcasm: 15, poeticism: 30 } }
  ];

  const primaryPresets = allPresets.slice(0, 4);
  const presetsToShow = showAllPresets ? allPresets : primaryPresets;

  const handleSliderChange = (vibeKey, value) => {
    const newVibes = { ...vibes, [vibeKey]: parseInt(value) };
    onVibesChange(newVibes);
  };

  const resetToDefaults = () => {
    const defaultVibes = { humor: 30, romance: 20, energy: 50, formality: 20, sarcasm: 10, poeticism: 20 };
    onVibesChange(defaultVibes);
  };

  const randomizeVibes = () => {
    const randomVibes = {};
    sliderConfig.forEach(({ key }) => {
      randomVibes[key] = Math.floor(Math.random() * 81) + 20;
    });
    onVibesChange(randomVibes);
  };

  const getVibeDescription = () => {
    const dominant = Object.entries(vibes).reduce((a, b) => vibes[a[1]] > vibes[b[1]] ? a : b);
    const dominantName = sliderConfig.find(s => s.key === dominant[0])?.label || 'Balanced';
    
    const secondary = Object.entries(vibes)
      .filter(([key]) => key !== dominant[0] && vibes[key] > 40)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([key]) => sliderConfig.find(s => s.key === key)?.label)
      .filter(Boolean);

    if (secondary.length > 0) {
      return `${dominantName} with ${secondary.join(' & ')}`;
    }
    return dominantName;
  };

  return (
    <div className={compact ? '' : 'p-6'}>
      {!compact && (
        <div className="mb-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Vibe Control</h3>
          <div className="text-sm text-gray-600">
            Current style: <strong className="text-primary-600">{getVibeDescription()}</strong>
          </div>
        </div>
      )}

      {/* Preset Pills */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {presetsToShow.map((preset, index) => (
            <motion.button
              key={preset.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPresetSelect ? onPresetSelect(preset.vibes) : onVibesChange(preset.vibes)}
              className="px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all"
            >
              {preset.name}
            </motion.button>
          ))}
        </div>
        
        {compact && (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAllPresets(!showAllPresets)}
            className="text-xs text-gray-500 hover:text-primary-500 transition-colors"
          >
            {showAllPresets ? 'Show less' : `+${allPresets.length - primaryPresets.length} more presets`}
          </motion.button>
        )}
      </div>

      {/* Vibe Sliders */}
      <div className="space-y-4 mb-6">
        {sliderConfig.map((slider, index) => (
          <motion.div
            key={slider.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-50 rounded-lg p-4"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: slider.color }}
                />
                <span className="font-medium text-gray-900">{slider.label}</span>
              </div>
              <motion.span
                key={vibes[slider.key]}
                initial={{ scale: 1.2, color: slider.color }}
                animate={{ scale: 1, color: '#374151' }}
                transition={{ duration: 0.3 }}
                className="font-bold text-lg min-w-[3rem] text-right"
              >
                {vibes[slider.key]}
              </motion.span>
            </div>
            
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={vibes[slider.key]}
                onChange={(e) => handleSliderChange(slider.key, e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer custom-slider"
                style={{
                  background: `linear-gradient(to right, ${slider.color} 0%, ${slider.color} ${vibes[slider.key]}%, #e5e7eb ${vibes[slider.key]}%, #e5e7eb 100%)`
                }}
              />
            </div>
            
            <AnimatePresence>
              {showDescriptions && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-gray-500 mt-2 italic"
                >
                  {slider.description}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {compact && (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDescriptions(!showDescriptions)}
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-primary-500 transition-colors"
          >
            {showDescriptions ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span>{showDescriptions ? 'Hide' : 'Show'} descriptions</span>
          </motion.button>
        )}

        {!compact && (
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetToDefaults}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={randomizeVibes}
              className="flex items-center space-x-2 px-4 py-2 bg-accent-100 text-accent-700 rounded-lg hover:bg-accent-200 transition-all text-sm"
            >
              <Shuffle className="w-4 h-4" />
              <span>Randomize</span>
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VibeSliders;
