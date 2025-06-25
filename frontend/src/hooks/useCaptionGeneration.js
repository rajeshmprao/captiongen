import { useState, useRef } from 'react';
import { apiService } from '../services/apiService';
import { debugInfoCollector } from '../utils/debugInfoCollector';

export const useCaptionGeneration = () => {
  const [caption, setCaption] = useState('');
  const [carouselResult, setCarouselResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorDebugInfo, setErrorDebugInfo] = useState(null);
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

    // Check if authenticated via JWT or has API key
    const isAuthenticated = apiService.authService.isAuthenticated();
    if (!isAuthenticated && !apiKey?.trim()) {
      throw new Error('Please sign in with Google or enter your API key');
    }setLoading(true);
    setError('');
    setErrorDebugInfo(null);
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
      const appState = {
        isCarouselMode: false,
        image,
        apiKey,
        captionType,
        useVibeSliders,
        vibes,
        loading: false
      };
      
      const debugInfo = debugInfoCollector.createErrorInfo(
        err,
        err.requestData,
        appState,
        err.serverDebugInfo
      );
      
      setError(err.message);
      setErrorDebugInfo(debugInfo);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  const generateCarouselCaption = async (images, apiKey, vibes, captionType, useVibeSliders) => {
    if (images.length === 0) {
      throw new Error('Please select images for the carousel');
    }

    // Check if authenticated via JWT or has API key
    const isAuthenticated = apiService.authService.isAuthenticated();
    if (!isAuthenticated && !apiKey?.trim()) {
      throw new Error('Please sign in with Google or enter your API key');
    }setLoading(true);
    setError('');
    setErrorDebugInfo(null);
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
      const appState = {
        isCarouselMode: true,
        images,
        apiKey,
        captionType,
        useVibeSliders,
        vibes,
        loading: false
      };
      
      const debugInfo = debugInfoCollector.createErrorInfo(
        err,
        err.requestData,
        appState,
        err.serverDebugInfo
      );
      
      setError(err.message);
      setErrorDebugInfo(debugInfo);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  const clearResults = () => {
    setCaption('');
    setCarouselResult(null);
    setError('');
    setErrorDebugInfo(null);
  };

  return {
    caption,
    carouselResult,
    loading,
    error,
    errorDebugInfo,
    resultsRef,
    generateSingleCaption,
    generateCarouselCaption,
    clearResults,
    setError
  };
};
