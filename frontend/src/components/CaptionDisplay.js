import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import './CaptionDisplay.css';

function CaptionDisplay({ caption }) {
  const [copyFeedback, setCopyFeedback] = useState('');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (err) {
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


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
        >
          <p className="text-lg text-gray-900 leading-relaxed">{caption}</p>
        </motion.div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AnimatePresence>
            {copyFeedback && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`text-sm ${copyFeedback === 'Copied!' ? 'text-green-600' : 'text-red-600'}`}
              >
                {copyFeedback}
              </motion.span>
            )}
          </AnimatePresence>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={copyToClipboard}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-all text-sm font-medium"
          >
            {copyFeedback === 'Copied!' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>Copy</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default CaptionDisplay;
