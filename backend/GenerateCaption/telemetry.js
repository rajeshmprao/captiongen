const crypto = require('crypto');

function getUserId(req) {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const language = req.headers['accept-language'] || 'unknown';
  
  return crypto.createHash('sha256')
    .update(userAgent + language)
    .digest('hex')
    .substring(0, 12);
}

function logRequestStart(context, data) {
  context.log('CaptionRequest', {
    requestId: data.requestId,
    userId: data.userId,
    requestType: data.requestType,
    captionType: data.captionType,
    vibes: data.vibes,
    timestamp: data.timestamp
  });
}

function logAuthFailure(context, data) {
  context.log.warn('AuthFailure', {
    requestId: data.requestId,
    userId: data.userId,
    timestamp: new Date().toISOString()
  });
}

function logImageProcessing(context, data) {
  context.log('ImageProcessing', {
    requestId: data.requestId,
    userId: data.userId,
    originalFormat: data.originalFormat,
    originalSize: data.originalSize,
    processedSize: data.processedSize
  });
}

function logLLMRequest(context, data) {
  context.log('LLMRequest', {
    requestId: data.requestId,
    userId: data.userId,
    promptLength: data.promptLength,
    imageSize: data.imageSize
  });
}

function logLLMResponse(context, data) {
  context.log('LLMResponse', {
    requestId: data.requestId,
    userId: data.userId,
    tokensUsed: data.tokensUsed || 0,
    responseTime: data.responseTime,
    success: data.success,
    error: data.error
  });
}

function logRequestComplete(context, data) {
  context.log('RequestComplete', {
    requestId: data.requestId,
    userId: data.userId,
    totalDuration: data.totalDuration,
    captionLength: data.captionLength,
    success: true
  });
}

function logError(context, data) {
  context.log.error('CaptionGenerationError', {
    requestId: data.requestId,
    userId: data.userId,
    error: data.error,
    errorType: data.errorType || 'UnknownError'
  });
}

module.exports = {
  getUserId,
  logRequestStart,
  logAuthFailure,
  logImageProcessing,
  logLLMRequest,
  logLLMResponse,
  logRequestComplete,
  logError
};
