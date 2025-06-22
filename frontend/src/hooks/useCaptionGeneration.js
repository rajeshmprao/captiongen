import { useState, useRef } from 'react';
import { apiService } from '../services/apiService';

export const useCaptionGeneration = () => {
  const [caption, setCaption] = useState('');
  const [carouselResult, setCarouselResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const resultsRef = useRef(null);

  const scrollToResults = () => {
    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  const generateSingleCaption = async (image, apiKey, vibes, captionType, useVibeSliders) => {
    if (!image) {
      throw new Error('Please select an image first');
    }

    if (!apiKey.trim()) {
      throw new Error('Please enter your API key');
    }

    setLoading(true);
    setError('');
    setCaption('');

    try {
      const result = await apiService.generateSingleCaption(
        image, 
        apiKey, 
        useVibeSliders ? vibes : { captionType }
      );
      
      setCaption(result.caption);
      scrollToResults();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateCarouselCaption = async (images, apiKey, vibes, captionType, useVibeSliders) => {
    if (images.length === 0) {
      throw new Error('Please select images for the carousel');
    }

    if (!apiKey.trim()) {
      throw new Error('Please enter your API key');
    }

    setLoading(true);
    setError('');
    setCarouselResult(null);

    try {
      const result = await apiService.generateCarouselCaption(
        images, 
        apiKey, 
        useVibeSliders ? vibes : { captionType }
      );
      
      setCarouselResult(result);
      scrollToResults();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setCaption('');
    setCarouselResult(null);
    setError('');
  };

  return {
    caption,
    carouselResult,
    loading,
    error,
    resultsRef,
    generateSingleCaption,
    generateCarouselCaption,
    clearResults,
    setError
  };
};
