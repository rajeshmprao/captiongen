import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import ImageCaptionPair from './ImageCaptionPair';

function CarouselCaptionDisplay({ carouselResult, imagePreviews = [] }) {
  const [copyFeedback, setCopyFeedback] = useState('');

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
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

  const copyAllIndividual = () => {
    const allCaptions = carouselResult.individualCaptions
      .map((caption, index) => `${index + 1}. ${caption}`)
      .join('\n');
    copyToClipboard(allCaptions);
  };

  if (!carouselResult) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Master Caption Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Master Caption for Carousel
            </h3>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => copyToClipboard(carouselResult.masterCaption)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all text-sm font-medium shadow-md"
            >
              {copyFeedback === 'Copied!' ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>Copy Master</span>
            </motion.button>
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg p-4 border border-primary-200"
          >
            <p className="text-lg text-gray-900 leading-relaxed">
              {carouselResult.masterCaption}
            </p>
          </motion.div>

          {copyFeedback && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-sm text-green-600"
            >
              {copyFeedback}
            </motion.div>
          )}
        </div>
      </div>

      {/* Individual Captions Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Individual Captions ({carouselResult.imageCount} images)
            </h3>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyAllIndividual}
              className="flex items-center space-x-2 px-3 py-2 bg-accent-100 text-accent-700 border border-accent-200 rounded-lg hover:bg-accent-200 transition-all text-sm font-medium"
            >
              <Copy className="w-4 h-4" />
              <span>Copy All</span>
            </motion.button>
          </div>
          
          <div className="space-y-3">
            {carouselResult.individualCaptions.map((caption, index) => (
              <ImageCaptionPair
                key={index}
                image={imagePreviews[index]}
                caption={caption}
                imageIndex={index}
                onCopy={(text) => copyToClipboard(text)}
                showRegenerate={false}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default CarouselCaptionDisplay;
