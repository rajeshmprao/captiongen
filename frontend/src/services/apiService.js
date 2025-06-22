import { imageService } from './imageService';

const API_URL = process.env.REACT_APP_API_URL;
const CAROUSEL_API_URL = process.env.REACT_APP_CAROUSEL_API_URL;

export const apiService = {
  async generateSingleCaption(image, apiKey, options) {
    const compressedBase64 = await imageService.compressImage(image, 300);
    const base64Image = compressedBase64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
    
    const requestBody = {
      image: base64Image,
      apiKey: apiKey.trim(),
      ...options
    };
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate caption');
    }

    return data;
  },

  async generateCarouselCaption(images, apiKey, options) {
    // Compress and convert all images to base64
    const compressedImages = await Promise.all(
      images.map(async (image) => {
        const compressed = await imageService.compressImage(image, 300);
        return compressed.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      })
    );

    const requestBody = {
      images: compressedImages,
      apiKey: apiKey.trim(),
      ...options
    };
    
    const response = await fetch(CAROUSEL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate carousel caption');
    }

    return data;
  }
};
