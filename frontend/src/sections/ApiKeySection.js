import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Key, Check } from 'lucide-react';

const ApiKeySection = ({ 
  apiKey, 
  setApiKey, 
  apiKeyCollapsed, 
  setApiKeyCollapsed, 
  clearApiKey 
}) => {
  return (
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
          >
            <div className="space-y-3">
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
      </AnimatePresence>
    </motion.div>
  );
};

export default ApiKeySection;
