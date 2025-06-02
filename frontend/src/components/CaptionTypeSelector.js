import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

function CaptionTypeSelector({ selectedType, onTypeChange, showAll = false, onToggleShowAll }) {
  const primaryTypes = [
    { value: 'funny', label: 'Funny', emoji: '😄' },
    { value: 'romantic', label: 'Romantic', emoji: '❤️' },
    { value: 'business', label: 'Business', emoji: '💼' },
    { value: 'artistic', label: 'Artistic', emoji: '🎨' }
  ];

  const secondaryTypes = [
    { value: 'default', label: 'Default', emoji: '🌟' },
    { value: 'motivational', label: 'Motivational', emoji: '💪' },
    { value: 'explain', label: 'Explain', emoji: '📝' },
    { value: 'witty', label: 'Witty', emoji: '🙃' }
  ];

  const typesToShow = showAll ? [...primaryTypes, ...secondaryTypes] : primaryTypes;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6"
      >
        {typesToShow.map((type, index) => (
          <motion.button
            key={type.value}
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTypeChange(type.value)}
            className={`
              p-4 rounded-xl border-2 transition-all group min-h-[100px]
              flex flex-col items-center justify-center space-y-2
              ${selectedType === type.value 
                ? 'border-primary-500 bg-primary-50 shadow-lg' 
                : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
              }
            `}
          >
            <motion.div
              animate={{ 
                rotate: selectedType === type.value ? [0, -10, 10, 0] : 0,
                scale: selectedType === type.value ? 1.1 : 1
              }}
              transition={{ duration: 0.5 }}
              className="text-3xl mb-1"
            >
              {type.emoji}
            </motion.div>
            <span className={`
              font-medium text-sm transition-colors
              ${selectedType === type.value 
                ? 'text-primary-700' 
                : 'text-gray-700 group-hover:text-primary-600'
              }
            `}>
              {type.label}
            </span>
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence>
        {onToggleShowAll && !showAll && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onToggleShowAll}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-all flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Show {secondaryTypes.length} more styles</span>
          </motion.button>
        )}
        
        {showAll && onToggleShowAll && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onToggleShowAll}
            className="w-full py-3 border border-gray-300 rounded-lg text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-all"
          >
            Show Less
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CaptionTypeSelector;
