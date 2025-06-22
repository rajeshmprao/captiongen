import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, Images, X } from 'lucide-react';
import './ImageUploader.css';

function ImageUploader({ onImageSelect, onMultiImageSelect, onImageRemove, isCarouselMode = false, imagePreviews = [] }) {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (isCarouselMode) {
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      if (imageFiles.length >= 2 && imageFiles.length <= 3) {
        onMultiImageSelect(imageFiles);
      } else {
        alert('Please select 2-3 images for carousel mode');
      }
    } else {
      const file = files[0];
      if (file && file.type.startsWith('image/')) {
        onImageSelect(file);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    
    if (isCarouselMode) {
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      if (imageFiles.length >= 2 && imageFiles.length <= 3) {
        onMultiImageSelect(imageFiles);
      } else {
        alert('Please drop 2-3 images for carousel mode');
      }
    } else {
      const file = files[0];
      if (file && file.type.startsWith('image/')) {
        onImageSelect(file);
      }
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
  const removeImage = (index) => {
    if (onImageRemove) {
      onImageRemove(index);
    }
  };

  if (isCarouselMode && imagePreviews.length > 0) {
    // Show carousel preview mode
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {imagePreviews.map((preview, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group"            >              <div className="w-full aspect-standard bg-gray-100">
                <img 
                  src={preview} 
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-contain rounded-lg shadow-md"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </motion.button>
            </motion.div>
          ))}
        </div>
        <button
          onClick={() => fileInputRef.current.click()}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-all"
        >
          Change Images (2-3 images)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

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
        multiple={isCarouselMode}
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
          {isCarouselMode ? <Images className="w-12 h-12" /> : <ImagePlus className="w-12 h-12" />}
        </motion.div>
        
        <h3 className={`text-lg font-semibold mb-2 transition-colors ${
          isDragOver ? 'text-primary-600' : 'text-gray-700 group-hover:text-primary-600'
        }`}>
          {isCarouselMode ? 'Upload 2-3 Images for Carousel' : 'Upload an Image'}
        </h3>
        
        <p className="text-gray-500 text-sm">
          {isCarouselMode 
            ? 'Drag and drop 2-3 images here, or click to browse'
            : 'Drag and drop an image here, or click to browse'
          }
        </p>
        
        <p className="text-xs text-gray-400 mt-2">
          Supports JPEG, PNG, GIF, WebP
        </p>
      </div>
    </motion.div>  );
}

export default ImageUploader;
