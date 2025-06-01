import React, { useState } from 'react';
import './App.css';
import ImageUploader from './components/ImageUploader';
import CaptionDisplay from './components/CaptionDisplay';
import CaptionTypeSelector from './components/CaptionTypeSelector';

function App() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [captionType, setCaptionType] = useState('default');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');

  // Use environment variable with fallback for API URL
  const API_URL = process.env.REACT_APP_API_URL || 'https://captiongen-func-xyz.azurewebsites.net/api/GenerateCaption';

  const handleImageSelect = (file) => {
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setCaption('');
    setError('');
  };

  const generateCaption = async () => {
    if (!image) {
      setError('Please select an image first');
      return;
    }

    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }

    setLoading(true);
    setError('');
    setCaption('');

    try {
      // Convert file to base64
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          // Remove the data URL prefix to get just the base64 string
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(image);
      });
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: base64Image,
          captionType: captionType,
          apiKey: apiKey.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate caption');
      }

      setCaption(data.caption);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Caption Generator</h1>
        <p>Upload an image and let AI create the perfect caption</p>
      </header>

      <main className="App-main">
        <div className="api-key-section">
          <label htmlFor="api-key">API Key:</label>
          <input
            id="api-key"
            type="password"
            placeholder="Enter your API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="api-key-input"
          />
          <p className="api-key-help">
            Your API key is stored locally and never sent to our servers except for authentication.
          </p>
        </div>

        <div className="upload-section">
          <ImageUploader onImageSelect={handleImageSelect} />
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
            </div>
          )}
        </div>

        <div className="controls-section">
          <CaptionTypeSelector 
            selectedType={captionType} 
            onTypeChange={setCaptionType} 
          />
          <button 
            className="generate-button"
            onClick={generateCaption}
            disabled={!image || loading || !apiKey.trim()}
          >
            {loading ? 'Generating...' : 'Generate Caption'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {caption && (
          <CaptionDisplay caption={caption} />
        )}
      </main>
    </div>
  );
}

export default App;
