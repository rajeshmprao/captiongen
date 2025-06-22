import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ErrorDisplay = ({ error }) => {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg mb-6"
        >
          {error}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ErrorDisplay;
