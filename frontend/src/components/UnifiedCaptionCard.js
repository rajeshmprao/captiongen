import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Smile, Heart, TrendingUp, Sparkles } from 'lucide-react';

function UnifiedCaptionCard({ image, caption, onCopy, onTweak }) {
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">          {/* Image Section */}
          <div className="relative bg-gray-100 aspect-landscape">            <img 
              src={image} 
              alt="Generated caption preview"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>

          {/* Caption Section */}
          <div className="p-6 flex flex-col justify-center">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Generated Caption
                </h3>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg p-4 border border-primary-200"
                >
                  <p className="text-gray-900 leading-relaxed">
                    {caption}
                  </p>
                </motion.div>
              </div>
              
              {/* Copy Button */}
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
                  onClick={handleCopy}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all text-sm font-medium shadow-md"
                >
                  {copyFeedback === 'Copied!' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>Copy Caption</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tweak Buttons */}
      {onTweak && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-md border border-gray-100 p-6"
        >
          <h4 className="text-md font-medium text-gray-900 mb-4">Quick Tweaks</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'funnier', label: 'Make it funnier', icon: Smile },
              { key: 'romantic', label: 'Add romance', icon: Heart },
              { key: 'energetic', label: 'More energy', icon: TrendingUp },
              { key: 'simpler', label: 'Keep it simple', icon: Sparkles }
            ].map((tweak, index) => (
              <motion.button
                key={tweak.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTweak(tweak.key)}
                className="flex items-center justify-center space-x-2 px-3 py-3 border border-primary-200 text-primary-600 rounded-lg hover:bg-primary-50 transition-all text-sm font-medium"
              >
                <tweak.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tweak.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default UnifiedCaptionCard;
