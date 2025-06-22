import React from 'react';
import AppHeader from './layouts/AppHeader';
import ApiKeySection from './sections/ApiKeySection';
import ModeToggleSection from './sections/ModeToggleSection';
import UploadSection from './sections/UploadSection';
import ControlsSection from './sections/ControlsSection';
import ErrorDisplay from './components/ErrorDisplay';
import LoadingButton from './components/LoadingButton';
import ResultsSection from './sections/ResultsSection';
import { useApiKey } from './hooks/useApiKey';
import { useImageState } from './hooks/useImageState';
import { useVibeControl } from './hooks/useVibeControl';
import { useCaptionGeneration } from './hooks/useCaptionGeneration';

function App() {
  // Custom hooks for state management
  const { 
    apiKey, 
    setApiKey, 
    apiKeyCollapsed, 
    setApiKeyCollapsed, 
    clearApiKey 
  } = useApiKey();

  const {
    image,
    imagePreview,
    images,
    imagePreviews,
    isCarouselMode,
    setIsCarouselMode,
    handleImageSelect,
    handleMultiImageSelect,
    handleImageRemove
  } = useImageState();

  const {
    captionType,
    setCaptionType,
    vibes,
    setVibes,
    useVibeSliders,
    setUseVibeSliders,
    showAllTypes,
    setShowAllTypes,
    applyTweak
  } = useVibeControl();

  const {
    caption,
    carouselResult,
    loading,
    error,
    resultsRef,
    generateSingleCaption,
    generateCarouselCaption,
    clearResults,
    setError
  } = useCaptionGeneration();

  // Enhanced image handlers that clear results
  const handleImageSelectWithClear = (file) => {
    handleImageSelect(file);
    clearResults();
  };

  const handleMultiImageSelectWithClear = async (files) => {
    try {
      await handleMultiImageSelect(files);
      clearResults();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImageRemoveWithClear = (index) => {
    handleImageRemove(index);
    clearResults();
  };

  // Caption generation handler
  const generateCaption = async () => {
    try {
      if (isCarouselMode) {
        await generateCarouselCaption(images, apiKey, vibes, captionType, useVibeSliders);
      } else {
        await generateSingleCaption(image, apiKey, vibes, captionType, useVibeSliders);
      }
    } catch (err) {
      // Error is already handled in the hooks
      if (err.message.includes('API key')) {
        setApiKeyCollapsed(false);
      }
    }
  };

  // Enhanced tweak handler
  const tweakCaption = async (tweakType) => {
    if ((!caption && !carouselResult) || loading) return;
    
    applyTweak(tweakType);
    setTimeout(() => generateCaption(), 100);
  };

  // Check if generate button should be disabled
  const isGenerateDisabled = (isCarouselMode ? images.length === 0 : !image) || loading || !apiKey.trim();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <ApiKeySection 
          apiKey={apiKey}
          setApiKey={setApiKey}
          apiKeyCollapsed={apiKeyCollapsed}
          setApiKeyCollapsed={setApiKeyCollapsed}
          clearApiKey={clearApiKey}
        />

        <ModeToggleSection 
          isCarouselMode={isCarouselMode}
          setIsCarouselMode={setIsCarouselMode}
        />

        <UploadSection 
          isCarouselMode={isCarouselMode}
          imagePreview={imagePreview}
          imagePreviews={imagePreviews}
          carouselResult={carouselResult}
          loading={loading}
          apiKey={apiKey}
          onImageSelect={handleImageSelectWithClear}
          onMultiImageSelect={handleMultiImageSelectWithClear}
          onImageRemove={handleImageRemoveWithClear}
          onRetry={generateCaption}
        />

        <ControlsSection 
          useVibeSliders={useVibeSliders}
          setUseVibeSliders={setUseVibeSliders}
          vibes={vibes}
          onVibesChange={setVibes}
          captionType={captionType}
          onTypeChange={setCaptionType}
          showAllTypes={showAllTypes}
          onToggleShowAll={() => setShowAllTypes(!showAllTypes)}
        />

        <ErrorDisplay error={error} />

        <LoadingButton 
          onClick={generateCaption}
          disabled={isGenerateDisabled}
          loading={loading}
        />

        <ResultsSection 
          resultsRef={resultsRef}
          isCarouselMode={isCarouselMode}
          caption={caption}
          imagePreview={imagePreview}
          carouselResult={carouselResult}
          imagePreviews={imagePreviews}
          onTweak={tweakCaption}
        />
      </main>
    </div>
  );
}

export default App;
