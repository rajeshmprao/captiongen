import React, { useState } from 'react';
import './CaptionDisplay.css';

function CaptionDisplay({ caption }) {
  const [copyFeedback, setCopyFeedback] = useState('');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = caption;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopyFeedback('Copied!');
        setTimeout(() => setCopyFeedback(''), 2000);
      } catch (fallbackErr) {
        setCopyFeedback('Copy failed');
        setTimeout(() => setCopyFeedback(''), 2000);
      }
      document.body.removeChild(textArea);
    }
  };

  const getCharacterInfo = () => {
    const count = caption.length;
    if (count <= 125) {
      return { text: `${count} characters (perfect for Twitter)`, color: '#27ae60' };
    } else if (count <= 280) {
      return { text: `${count} characters (good for most platforms)`, color: '#f39c12' };
    } else {
      return { text: `${count} characters (might be too long)`, color: '#e74c3c' };
    }
  };

  const characterInfo = getCharacterInfo();

  return (
    <div className="caption-display">
      <div className="caption-text">
        {caption}
      </div>
      
      <div className="caption-actions">
        <div className="caption-info">
          <div 
            className="character-count" 
            style={{ color: characterInfo.color }}
          >
            {characterInfo.text}
          </div>
        </div>
        
        <div className="caption-controls">
          <span 
            className={`copy-feedback ${copyFeedback ? 'show' : ''}`}
          >
            {copyFeedback}
          </span>
          <button 
            className="copy-button"
            onClick={copyToClipboard}
            title="Copy caption to clipboard"
          >
            📋 Copy
          </button>
        </div>
      </div>
    </div>
  );
}

export default CaptionDisplay;
