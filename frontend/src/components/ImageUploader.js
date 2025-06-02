import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, ImagePlus } from 'lucide-react';
import './ImageUploader.css';

function ImageUploader({ onImageSelect }) {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`
        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
        min-h-[200px] flex items-center justify-center
        transition-all duration-300 group
        ${isDragOver 
          ? 'border-primary-400 bg-primary-50' 
          : 'border-gray-300 bg-gray-50 hover:bg-primary-50 hover:border-primary-300'
        }
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="text-center">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`mx-auto mb-4 transition-colors ${
            isDragOver ? 'text-primary-500' : 'text-gray-400 group-hover:text-primary-400'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto mb-2" />
          <ImagePlus className="w-8 h-8 mx-auto" />
        </motion.div>
        
        <motion.p 
          className={`text-lg font-medium transition-colors ${
            isDragOver ? 'text-primary-700' : 'text-gray-700 group-hover:text-primary-600'
          }`}
        >
          Drop an image here or click to select
        </motion.p>
        
        <p className="text-sm text-gray-500 mt-2">
          Supports: JPG, PNG, GIF, WebP
        </p>
      </div>
    </motion.div>
  );
}

export default ImageUploader;
