import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Key, 
  Check, 
  Zap, 
  Loader, 
  Sparkles 
} from 'lucide-react';
import ImageUploader from './components/ImageUploader';
import CarouselCaptionDisplay from './components/CarouselCaptionDisplay';
import UnifiedCaptionCard from './components/UnifiedCaptionCard';
import CaptionTypeSelector from './components/CaptionTypeSelector';
import VibeSliders from './components/VibeSliders';

function App() {
  // Single image state (existing)
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Multi-image state (new)
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isCarouselMode, setIsCarouselMode] = useState(false);
  
  // Results ref for auto-scroll
  const resultsRef = useRef(null);
  
  // Auto-scroll to results
  const scrollToResults = () => {
    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100); // Small delay to ensure DOM is updated
  };
  
  // Caption configuration
  const [captionType, setCaptionType] = useState('default');
  const [vibes, setVibes] = useState({
    humor: 30,
    romance: 20,
    energy: 50,
    formality: 20,
    sarcasm: 10,
    poeticism: 20
  });
  const [useVibeSliders, setUseVibeSliders] = useState(false);
  
  // Results state
  const [caption, setCaption] = useState('');
  const [carouselResult, setCarouselResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');  const [apiKey, setApiKey] = useState('');
  
  // Mobile UX state
  const [apiKeyCollapsed, setApiKeyCollapsed] = useState(false);
  const [showAllTypes, setShowAllTypes] = useState(false);  
  const API_URL = process.env.REACT_APP_API_URL;
  const CAROUSEL_API_URL = process.env.REACT_APP_CAROUSEL_API_URL;
  
  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('captiongen-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);
  
  // Save API key to localStorage when it changes
  useEffect(() => {
    if (apiKey.trim()) {
      localStorage.setItem('captiongen-api-key', apiKey.trim());
    }
  }, [apiKey]);
    // Auto-collapse API key section after it's entered
  useEffect(() => {
    if (apiKey.trim().length > 10) {
      setApiKeyCollapsed(true);
    }
  }, [apiKey]);

  // Clear API key from state and localStorage
  const clearApiKey = () => {
    setApiKey('');
    localStorage.removeItem('captiongen-api-key');
    setApiKeyCollapsed(false);
  };

  // Client-side image compression utility
  const compressImage = (file, maxSizeKB = 300) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate dimensions to maintain aspect ratio
        const maxDimension = 800;
        let { width, height } = img;
        
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Start with high quality and reduce until size target is met
        let quality = 0.9;
        let compressed;
        
        do {
          compressed = canvas.toDataURL('image/jpeg', quality);
          quality -= 0.1;
        } while (compressed.length > maxSizeKB * 1024 * 1.37 && quality > 0.1); // 1.37 accounts for base64 overhead
        
        resolve(compressed);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageSelect = (file) => {
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setCaption('');
    setCarouselResult(null);
    setError('');
    setIsCarouselMode(false);
  };
  const handleMultiImageSelect = async (files) => {
    if (files.length < 2 || files.length > 3) {
      setError('Please select 2-3 images for carousel mode');
      return;
    }

    setImages(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
    setCaption('');
    setCarouselResult(null);
    setError('');
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
      setCarouselResult(null);
      setError('');
    } else {
      setImages(newImages);
      setImagePreviews(newImagePreviews);
      // Clear results when images change
      setCarouselResult(null);
      setError('');
    }
  };

  const generateCaption = async () => {
    if (isCarouselMode) {
      return generateCarouselCaption();
    } else {
      return generateSingleCaption();
    }
  };

  const generateSingleCaption = async () => {
    if (!image) {
      setError('Please select an image first');
      return;
    }

    if (!apiKey.trim()) {
      setError('Please enter your API key');
      setApiKeyCollapsed(false);
      return;
    }

    setLoading(true);
    setError('');
    setCaption('');    try {
      // Compress image for network transmission while keeping original for UI
      const compressedBase64 = await compressImage(image, 300);
      const base64Image = compressedBase64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      
      const requestBody = {
        image: base64Image,
        apiKey: apiKey.trim()
      };

      if (useVibeSliders) {
        requestBody.vibes = vibes;
      } else {
        requestBody.captionType = captionType;
      }
      
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

      setCaption(data.caption);
      scrollToResults();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateCarouselCaption = async () => {
    if (images.length === 0) {
      setError('Please select images for the carousel');
      return;
    }

    if (!apiKey.trim()) {
      setError('Please enter your API key');
      setApiKeyCollapsed(false);
      return;
    }

    setLoading(true);
    setError('');
    setCarouselResult(null);

    try {
      // Compress and convert all images to base64
      const compressedImages = await Promise.all(
        images.map(async (image) => {
          const compressed = await compressImage(image, 300);
          return compressed.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        })
      );

      const requestBody = {
        images: compressedImages,
        apiKey: apiKey.trim()
      };

      if (useVibeSliders) {
        requestBody.vibes = vibes;
      } else {
        requestBody.captionType = captionType;
      }
      
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

      setCarouselResult(data);
      scrollToResults();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }  };

  const tweakCaption = async (tweakType) => {
    if ((!caption && !carouselResult) || loading) return;
    
    const tweaks = {
      funnier: { humor: Math.min(100, vibes.humor + 20), formality: Math.max(0, vibes.formality - 10) },
      romantic: { romance: Math.min(100, vibes.romance + 25), sarcasm: Math.max(0, vibes.sarcasm - 15) },
      energetic: { energy: Math.min(100, vibes.energy + 20), humor: Math.min(100, vibes.humor + 10) },
      simpler: { poeticism: Math.max(0, vibes.poeticism - 15), sarcasm: Math.max(0, vibes.sarcasm - 10) }
    };

    const newVibes = { ...vibes, ...tweaks[tweakType] };
    setVibes(newVibes);
    
    setUseVibeSliders(true);
    setTimeout(() => generateCaption(), 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Animated Header */}
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

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Collapsible API Key Section */}
        <motion.div
          layout
          className={`bg-white rounded-xl shadow-md border border-gray-200 mb-6 overflow-hidden transition-all duration-300 ${
            apiKeyCollapsed ? 'shadow-sm' : 'shadow-lg'
          }`}
        >
          <motion.button
            onClick={() => setApiKeyCollapsed(!apiKeyCollapsed)}
            className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ rotate: apiKeyCollapsed ? 0 : 180 }}
                className="text-gray-500"
              >
                <ChevronDown className="w-5 h-5" />
              </motion.div>
              <span className="font-medium text-gray-900">API Configuration</span>
              {apiKey && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center space-x-1 text-green-600"
                >
                  <Check className="w-4 h-4" />
                  <span className="text-sm">Connected</span>
                </motion.div>
              )}
            </div>
          </motion.button>
          
          <AnimatePresence>
            {!apiKeyCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6"
              >                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-10"
                      placeholder="Enter your API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <Key className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                  </div>
                  
                  {apiKey.trim() && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-green-600">
                        ✓ API key saved locally
                      </p>
                      <button
                        onClick={clearApiKey}
                        className="text-sm text-red-600 hover:text-red-700 transition-colors"
                      >
                        Clear saved key
                      </button>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-600">
                    Your API key is stored locally and never sent to our servers except for authentication.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>        </motion.div>

        {/* Mode Toggle */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 mb-6 p-6">
          <div className="flex items-center justify-center space-x-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCarouselMode(false)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                !isCarouselMode 
                  ? 'bg-primary-500 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Single Image
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCarouselMode(true)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                isCarouselMode 
                  ? 'bg-primary-500 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Carousel (2-3 Images)
            </motion.button>
          </div>
        </div>

        {/* Upload Section */}
        <div className="grid lg:grid-cols-5 gap-6 mb-8">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="lg:col-span-3"
          >            <ImageUploader 
              onImageSelect={handleImageSelect}
              onMultiImageSelect={handleMultiImageSelect}
              onImageRemove={handleImageRemove}
              isCarouselMode={isCarouselMode}
              imagePreviews={imagePreviews}
            />
          </motion.div>

          <AnimatePresence>
            {imagePreview && !isCarouselMode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="lg:col-span-2"
              >                <div className="relative bg-gray-100 rounded-xl shadow-lg overflow-hidden aspect-landscape">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                  />
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/20 flex items-center justify-center"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="bg-white/90 p-2 rounded-full"
                    >
                      <Sparkles className="w-5 h-5 text-gray-700" />
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isCarouselMode && imagePreviews.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="lg:col-span-2"
              >
                <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
                  <CarouselCaptionDisplay 
                    imagePreviews={imagePreviews}
                    captions={carouselResult}
                    isLoading={loading}
                    apiKey={apiKey}
                    onRetry={generateCaption}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Caption Controls */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
          <div className="flex bg-gray-50">
            {['Quick Styles', 'Advanced Control'].map((tab, index) => (
              <motion.button
                key={tab}
                onClick={() => setUseVibeSliders(index === 1)}
                className={`flex-1 px-6 py-4 font-medium transition-all relative ${
                  (index === 1) === useVibeSliders
                    ? 'text-primary-600 bg-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
              >
                <span className="relative z-10">{tab}</span>
                {(index === 1) === useVibeSliders && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white shadow-sm"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={useVibeSliders ? 'advanced' : 'quick'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              {useVibeSliders ? (
                <VibeSliders 
                  vibes={vibes}
                  onVibesChange={setVibes}
                  compact={true}
                />
              ) : (
                <CaptionTypeSelector 
                  selectedType={captionType} 
                  onTypeChange={setCaptionType}
                  showAll={showAllTypes}
                  onToggleShowAll={() => setShowAllTypes(!showAllTypes)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Error Message */}
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

        {/* Generate Button */}
        <motion.div 
          className="sticky bottom-4 z-20 md:static md:bottom-auto mb-8"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.button
            onClick={generateCaption}
            disabled={
              (isCarouselMode ? images.length === 0 : !image) || loading || !apiKey.trim()
            }
            className={`
              w-full max-w-md mx-auto px-8 py-4 rounded-xl font-semibold text-lg
              transition-all duration-300 relative overflow-hidden group flex items-center justify-center space-x-2
              ${(!isCarouselMode && !image) || (isCarouselMode && images.length === 0) || loading || !apiKey.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg hover:shadow-2xl'
              }
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
                  <span>Generate Caption</span>
                </>
              )}
            </span>
          </motion.button>
        </motion.div>        {/* Results */}
        <div ref={resultsRef}>
          <AnimatePresence>
          {caption && !isCarouselMode && (
            <UnifiedCaptionCard 
              image={imagePreview}
              caption={caption}
              onCopy={(text) => {
                // Optional: Add any additional copy handling
                console.log('Caption copied:', text);
              }}
              onTweak={tweakCaption}
            />
          )}
        </AnimatePresence>        {/* Carousel Results */}
        <AnimatePresence>
          {isCarouselMode && carouselResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
            >
              <CarouselCaptionDisplay 
                carouselResult={carouselResult} 
                imagePreviews={imagePreviews}
              />
            </motion.div>          )}
        </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;
