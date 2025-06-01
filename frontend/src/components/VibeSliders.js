import React from 'react';
import './VibeSliders.css';

const VibeSliders = ({ vibes, onVibesChange, onPresetSelect }) => {
  const sliderConfig = [
    { key: 'humor', label: 'Humor', color: '#FFD700', description: 'From deadpan to hilarious' },
    { key: 'romance', label: 'Romance', color: '#FF69B4', description: 'From platonic to deeply romantic' },
    { key: 'energy', label: 'Energy', color: '#FF6B35', description: 'From calm to high-energy' },
    { key: 'formality', label: 'Formality', color: '#4A90E2', description: 'From casual to professional' },
    { key: 'sarcasm', label: 'Sarcasm', color: '#9B59B6', description: 'From genuine to sarcastic' },
    { key: 'poeticism', label: 'Poeticism', color: '#2ECC71', description: 'From straightforward to lyrical' }
  ];

  const presets = [
    { name: 'Funny', vibes: { humor: 80, energy: 60, formality: 10, romance: 10, sarcasm: 30, poeticism: 20 } },
    { name: 'Romantic', vibes: { humor: 20, energy: 40, formality: 30, romance: 80, sarcasm: 5, poeticism: 60 } },
    { name: 'Motivational', vibes: { humor: 30, energy: 90, formality: 60, romance: 20, sarcasm: 10, poeticism: 40 } },
    { name: 'Professional', vibes: { humor: 20, energy: 50, formality: 80, romance: 10, sarcasm: 15, poeticism: 50 } },
    { name: 'Balanced', vibes: { humor: 30, energy: 50, formality: 30, romance: 20, sarcasm: 15, poeticism: 30 } }
  ];

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
      randomVibes[key] = Math.floor(Math.random() * 81) + 20; // 20-100 range
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
    <div className="vibe-sliders">
      <div className="vibe-header">
        <h3>Vibe Control</h3>
        <div className="vibe-description">
          Current style: <strong>{getVibeDescription()}</strong>
        </div>
      </div>

      <div className="preset-buttons">
        {presets.map(preset => (
          <button
            key={preset.name}
            className="preset-button"
            onClick={() => onPresetSelect ? onPresetSelect(preset.vibes) : onVibesChange(preset.vibes)}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="sliders-container">
        {sliderConfig.map(({ key, label, color, description }) => (
          <div key={key} className="slider-group">
            <div className="slider-header">
              <label className="slider-label">{label}</label>
              <span className="slider-value">{vibes[key]}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={vibes[key]}
              onChange={(e) => handleSliderChange(key, e.target.value)}
              className="slider"
              style={{ '--slider-color': color }}
            />
            <div className="slider-description">{description}</div>
          </div>
        ))}
      </div>

      <div className="control-buttons">
        <button className="control-button" onClick={resetToDefaults}>
          Reset to Defaults
        </button>
        <button className="control-button" onClick={randomizeVibes}>
          Randomize Vibes
        </button>
      </div>
    </div>
  );
};

export default VibeSliders;
