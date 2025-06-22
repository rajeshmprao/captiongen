import { useState, useEffect } from 'react';

export const useApiKey = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiKeyCollapsed, setApiKeyCollapsed] = useState(false);

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

  const clearApiKey = () => {
    setApiKey('');
    localStorage.removeItem('captiongen-api-key');
    setApiKeyCollapsed(false);
  };

  return {
    apiKey,
    setApiKey,
    apiKeyCollapsed,
    setApiKeyCollapsed,
    clearApiKey
  };
};
