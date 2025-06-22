import React from 'react';
import { motion } from 'framer-motion';

const AppHeader = () => {
  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-gradient-to-r from-primary-600 via-accent-600 to-primary-800 relative overflow-hidden"
    >
      {/* Animated background shapes */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full"
      />
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-4 left-4 w-16 h-16 bg-white/5 rounded-full"
      />
      
      <div className="container mx-auto px-6 py-12 text-white text-center relative z-10">
        <motion.h1 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-4xl md:text-5xl font-extrabold mb-4"
        >
          AI Caption Generator
        </motion.h1>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-primary-100"
        >
          Upload an image and let AI create the perfect caption
        </motion.p>
      </div>
    </motion.header>
  );
};

export default AppHeader;
