import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { debugInfoCollector } from '../utils/debugInfoCollector';

const ErrorDisplay = ({ error, debugInfo }) => {
  const [copyFeedback, setCopyFeedback] = useState('');

  const handleCopyDebugInfo = async () => {
    if (!debugInfo) return;
    
    const result = await debugInfoCollector.copyToClipboard(debugInfo);
    setCopyFeedback(result.message);
    setTimeout(() => setCopyFeedback(''), 3000);
  };

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg mb-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span className="flex-1">{error}</span>
            </div>
            
            {debugInfo && (
              <div className="flex items-center space-x-2 ml-4">
                {copyFeedback && (
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={`text-xs ${copyFeedback.includes('copied') || copyFeedback.includes('copied') ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {copyFeedback}
                  </motion.span>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopyDebugInfo}
                  className="flex items-center space-x-1 px-2 py-1 bg-error-100 hover:bg-error-200 rounded text-xs font-medium transition-all"
                  title="Copy debug information for support"
                >
                  {copyFeedback.includes('copied') || copyFeedback.includes('copied') ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>Copy Debug Info</span>
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ErrorDisplay;
