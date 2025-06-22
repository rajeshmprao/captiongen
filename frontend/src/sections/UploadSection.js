import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import CarouselCaptionDisplay from '../components/CarouselCaptionDisplay';

const UploadSection = ({ 
  isCarouselMode,
  imagePreview,
  imagePreviews,
  carouselResult,
  loading,
  apiKey,
  onImageSelect,
  onMultiImageSelect,
  onImageRemove,
  onRetry
}) => {
  return (
    <div className="grid lg:grid-cols-5 gap-6 mb-8">
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="lg:col-span-3"
      >
        <ImageUploader 
          onImageSelect={onImageSelect}
          onMultiImageSelect={onMultiImageSelect}
          onImageRemove={onImageRemove}
          isCarouselMode={isCarouselMode}
          imagePreviews={imagePreviews}
        />
      </motion.div>

      <AnimatePresence>
        {imagePreview && !isCarouselMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="lg:col-span-2"
          >
            <div className="relative bg-gray-100 rounded-xl shadow-lg overflow-hidden aspect-landscape">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-full object-contain"
              />
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 bg-black/20 flex items-center justify-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="bg-white/90 p-2 rounded-full"
                >
                  <Sparkles className="w-5 h-5 text-gray-700" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCarouselMode && imagePreviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="lg:col-span-2"
          >
            <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
              <CarouselCaptionDisplay 
                imagePreviews={imagePreviews}
                captions={carouselResult}
                isLoading={loading}
                apiKey={apiKey}
                onRetry={onRetry}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadSection;
