import React from 'react';
import { motion } from 'framer-motion';
import { Loader, Zap } from 'lucide-react';

const LoadingButton = ({ 
  onClick, 
  disabled, 
  loading, 
  children,
  className = ""
}) => {
  return (
    <motion.div 
      className="sticky bottom-4 z-20 md:static md:bottom-auto mb-8"
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      <motion.button
        onClick={onClick}
        disabled={disabled}
        className={`
          w-full max-w-md mx-auto px-8 py-4 rounded-xl font-semibold text-lg
          transition-all duration-300 relative overflow-hidden group flex items-center justify-center space-x-2
          ${disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg hover:shadow-2xl'
          } ${className}
        `}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-accent-600 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"
          initial={false}
        />
        
        <span className="relative z-10 flex items-center space-x-2">
          {loading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader className="w-5 h-5" />
              </motion.div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>{children || 'Generate Caption'}</span>
            </>
          )}
        </span>
      </motion.button>
    </motion.div>
  );
};

export default LoadingButton;
