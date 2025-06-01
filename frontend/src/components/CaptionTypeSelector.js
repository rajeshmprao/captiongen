import React from 'react';
import './CaptionTypeSelector.css';

function CaptionTypeSelector({ selectedType, onTypeChange }) {
  const captionTypes = [
    { value: 'default', label: 'Default', emoji: '🌟' },
    { value: 'funny', label: 'Funny', emoji: '😄' },
    { value: 'romantic', label: 'Romantic', emoji: '❤️' },
    { value: 'motivational', label: 'Motivational', emoji: '💪' },
    { value: 'explain', label: 'Explain', emoji: '📝' }
  ];

  return (
    <div className="caption-type-selector">
      <h3>Select Caption Style:</h3>
      <div className="type-buttons">
        {captionTypes.map(type => (
          <button
            key={type.value}
            className={`type-button ${selectedType === type.value ? 'active' : ''}`}
            onClick={() => onTypeChange(type.value)}
          >
            <span className="type-emoji">{type.emoji}</span>
            <span className="type-label">{type.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default CaptionTypeSelector;
