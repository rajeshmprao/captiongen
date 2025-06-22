import { useState } from 'react';

export const useImageState = () => {
  // Single image state
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Multi-image state
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isCarouselMode, setIsCarouselMode] = useState(false);

  const handleImageSelect = (file) => {
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setIsCarouselMode(false);
  };

  const handleMultiImageSelect = async (files) => {
    if (files.length < 2 || files.length > 3) {
      throw new Error('Please select 2-3 images for carousel mode');
    }

    setImages(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
    setIsCarouselMode(true);
  };

  const handleImageRemove = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newImagePreviews = imagePreviews.filter((_, i) => i !== index);
    
    if (newImages.length < 2) {
      // If less than 2 images remaining, exit carousel mode
      setImages([]);
      setImagePreviews([]);
      setIsCarouselMode(false);
    } else {
      setImages(newImages);
      setImagePreviews(newImagePreviews);
    }
  };

  const clearImages = () => {
    setImage(null);
    setImagePreview(null);
    setImages([]);
    setImagePreviews([]);
  };

  return {
    image,
    imagePreview,
    images,
    imagePreviews,
    isCarouselMode,
    setIsCarouselMode,
    handleImageSelect,
    handleMultiImageSelect,
    handleImageRemove,
    clearImages
  };
};
