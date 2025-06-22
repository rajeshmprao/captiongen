import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, RotateCcw } from 'lucide-react';

function ImageCaptionPair({ image, caption, imageIndex, onCopy, onRegenerate, showRegenerate = false }) {
  const [copyFeedback, setCopyFeedback] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(''), 2000);
      if (onCopy) onCopy(caption);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = caption;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopyFeedback('Copied!');
        setTimeout(() => setCopyFeedback(''), 2000);
        if (onCopy) onCopy(caption);
      } catch (fallbackErr) {
        setCopyFeedback('Copy failed');
        setTimeout(() => setCopyFeedback(''), 2000);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-200 transition-all"
    >      {/* Image Thumbnail */}
      <div className="flex-shrink-0">        <div className="relative w-20 aspect-thumbnail bg-gray-100 rounded-lg">
          <img 
            src={image} 
            alt={`Preview ${imageIndex + 1}`}
            className="w-full h-full object-contain rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => {
              // Optional: Open image in lightbox/modal
              console.log('Image clicked for full view');
            }}
          />
          {imageIndex !== undefined && (
            <div className="absolute -top-2 -left-2 bg-primary-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {imageIndex + 1}
            </div>
          )}
        </div>
      </div>

      {/* Caption Content */}
      <div className="flex-1 min-w-0">
        <div className="space-y-3">
          <p className="text-gray-900 leading-relaxed text-sm md:text-base">
            {caption}
          </p>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {copyFeedback && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`text-xs ${copyFeedback === 'Copied!' ? 'text-green-600' : 'text-red-600'}`}
              >
                {copyFeedback}
              </motion.span>
            )}
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopy}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white text-primary-600 border border-primary-200 rounded-md hover:bg-primary-50 transition-all text-xs font-medium"
            >
              {copyFeedback === 'Copied!' ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>Copy</span>
            </motion.button>

            {showRegenerate && onRegenerate && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onRegenerate(imageIndex)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-white text-accent-600 border border-accent-200 rounded-md hover:bg-accent-50 transition-all text-xs font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ImageCaptionPair;
