import React, { useState } from 'react';
import './CaptionDisplay.css';

function CaptionDisplay({ caption }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="caption-display">
      <h3>Generated Caption:</h3>
      <div className="caption-content">
        <p>{caption}</p>
        <button 
          className="copy-button"
          onClick={copyToClipboard}
          title="Copy to clipboard"
        >
          {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
      </div>
    </div>
  );
}

export default CaptionDisplay;
