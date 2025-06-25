/**
 * Collects comprehensive debug information for error reporting
 */

export const debugInfoCollector = {
  /**
   * Collect client-side environment information
   */
  collectEnvironmentInfo() {
    return {
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      screen: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      platform: navigator.platform,
      url: window.location.href,
      referrer: document.referrer
    };
  },

  /**
   * Collect current application state
   */
  collectApplicationState(appState = {}) {
    return {
      mode: appState.isCarouselMode ? 'carousel' : 'single',
      captionType: appState.captionType,
      useVibeSliders: appState.useVibeSliders,
      vibes: appState.vibes,
      imageCount: appState.isCarouselMode ? (appState.images?.length || 0) : (appState.image ? 1 : 0),
      hasApiKey: !!appState.apiKey?.trim(),
      loading: appState.loading
    };
  },

  /**
   * Collect request-specific information
   */
  collectRequestInfo(requestData = {}) {
    return {
      endpoint: requestData.url,
      method: requestData.method || 'POST',
      timestamp: new Date().toISOString(),
      payloadSize: requestData.payloadSize,
      duration: requestData.duration,
      status: requestData.status,
      statusText: requestData.statusText
    };
  },
  /**
   * Create formatted debug information for copying
   */
  formatDebugInfo(errorInfo) {
    const sections = [];
    
    // Helper function to format values properly
    const formatValue = (value) => {
      if (value === null) return 'null';
      if (value === undefined) return 'undefined';
      if (typeof value === 'object') {
        try {
          return JSON.stringify(value, null, 2);
        } catch (e) {
          return String(value);
        }
      }
      return String(value);
    };

    // Error Summary
    sections.push('=== ERROR SUMMARY ===');
    sections.push(`Error: ${errorInfo.error}`);
    sections.push(`Timestamp: ${errorInfo.timestamp}`);
    sections.push(`Error ID: ${errorInfo.errorId}`);
    sections.push('');

    // Request Details
    if (errorInfo.requestInfo) {
      sections.push('=== REQUEST DETAILS ===');
      Object.entries(errorInfo.requestInfo).forEach(([key, value]) => {
        sections.push(`${key}: ${formatValue(value)}`);
      });
      sections.push('');
    }

    // Server Debug Info
    if (errorInfo.serverDebugInfo) {
      sections.push('=== SERVER CONTEXT ===');
      Object.entries(errorInfo.serverDebugInfo).forEach(([key, value]) => {
        sections.push(`${key}: ${formatValue(value)}`);
      });
      sections.push('');
    }

    // Application State
    if (errorInfo.applicationState) {
      sections.push('=== APPLICATION STATE ===');
      Object.entries(errorInfo.applicationState).forEach(([key, value]) => {
        sections.push(`${key}: ${formatValue(value)}`);
      });
      sections.push('');
    }

    // Environment Info
    if (errorInfo.environmentInfo) {
      sections.push('=== ENVIRONMENT INFO ===');
      Object.entries(errorInfo.environmentInfo).forEach(([key, value]) => {
        sections.push(`${key}: ${formatValue(value)}`);
      });
      sections.push('');
    }

    return sections.join('\n');
  },

  /**
   * Create a comprehensive error info object
   */
  createErrorInfo(error, requestData, appState, serverDebugInfo = null) {
    const errorId = this.generateErrorId();
    
    return {
      errorId,
      error: error.message || error,
      timestamp: new Date().toISOString(),
      requestInfo: this.collectRequestInfo(requestData),
      applicationState: this.collectApplicationState(appState),
      environmentInfo: this.collectEnvironmentInfo(),
      serverDebugInfo
    };
  },

  /**
   * Generate a unique error ID for tracking
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Copy formatted debug info to clipboard
   */
  async copyToClipboard(debugInfo) {
    const formattedInfo = this.formatDebugInfo(debugInfo);
    
    try {
      await navigator.clipboard.writeText(formattedInfo);
      return { success: true, message: 'Debug info copied to clipboard!' };
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = formattedInfo;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return { success: true, message: 'Debug info copied to clipboard!' };
      } catch (fallbackErr) {
        document.body.removeChild(textArea);
        return { success: false, message: 'Failed to copy debug info' };
      }
    }
  }
};
