import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UnifiedCaptionCard from '../components/UnifiedCaptionCard';
import CarouselCaptionDisplay from '../components/CarouselCaptionDisplay';

const ResultsSection = ({ 
  resultsRef,
  isCarouselMode,
  caption,
  imagePreview,
  carouselResult,
  imagePreviews,
  onTweak
}) => {
  return (
    <div ref={resultsRef}>
      <AnimatePresence>
        {caption && !isCarouselMode && (
          <UnifiedCaptionCard 
            image={imagePreview}
            caption={caption}
            onCopy={(text) => {
              console.log('Caption copied:', text);
            }}
            onTweak={onTweak}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCarouselMode && carouselResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
          >
            <CarouselCaptionDisplay 
              carouselResult={carouselResult} 
              imagePreviews={imagePreviews}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResultsSection;
