import React from 'react';
import { motion } from 'framer-motion';

const ModeToggleSection = ({ isCarouselMode, setIsCarouselMode }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 mb-6 p-6">
      <div className="flex items-center justify-center space-x-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCarouselMode(false)}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            !isCarouselMode 
              ? 'bg-primary-500 text-white shadow-lg' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Single Image
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCarouselMode(true)}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            isCarouselMode 
              ? 'bg-primary-500 text-white shadow-lg' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Carousel (2-3 Images)
        </motion.button>
      </div>
    </div>
  );
};

export default ModeToggleSection;
