import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CaptionTypeSelector from '../components/CaptionTypeSelector';
import VibeSliders from '../components/VibeSliders';

const ControlsSection = ({
  useVibeSliders,
  setUseVibeSliders,
  vibes,
  onVibesChange,
  captionType,
  onTypeChange,
  showAllTypes,
  onToggleShowAll
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
      <div className="flex bg-gray-50">
        {['Quick Styles', 'Advanced Control'].map((tab, index) => (
          <motion.button
            key={tab}
            onClick={() => setUseVibeSliders(index === 1)}
            className={`flex-1 px-6 py-4 font-medium transition-all relative ${
              (index === 1) === useVibeSliders
                ? 'text-primary-600 bg-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
          >
            <span className="relative z-10">{tab}</span>
            {(index === 1) === useVibeSliders && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white shadow-sm"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={useVibeSliders ? 'advanced' : 'quick'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="p-6"
        >
          {useVibeSliders ? (
            <VibeSliders 
              vibes={vibes}
              onVibesChange={onVibesChange}
              compact={true}
            />
          ) : (
            <CaptionTypeSelector 
              selectedType={captionType} 
              onTypeChange={onTypeChange}
              showAll={showAllTypes}
              onToggleShowAll={onToggleShowAll}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ControlsSection;
