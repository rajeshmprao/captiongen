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
  context.log.info('Caption request started', {
    requestId: data.requestId,
    userId: data.userId,
    requestType: data.requestType,
    captionType: data.captionType,
    vibes: data.vibes,
    timestamp: data.timestamp
  });
}

function logAuthFailure(context, data) {
  context.log.warn('Authentication failed', {
    requestId: data.requestId,
    userId: data.userId,
    timestamp: new Date().toISOString()
  });
}

function logImageProcessing(context, data) {
  context.log.info('Image processing completed', {
    requestId: data.requestId,
    userId: data.userId,
    originalFormat: data.originalFormat,
    originalSize: data.originalSize,
    processedSize: data.processedSize
  });
}

function logLLMRequest(context, data) {
  context.log.info('LLM request initiated', {
    requestId: data.requestId,
    userId: data.userId,
    promptLength: data.promptLength,
    imageSize: data.imageSize
  });
}

function logLLMResponse(context, data) {
  context.log.info('LLM response received', {
    requestId: data.requestId,
    userId: data.userId,
    tokensUsed: data.tokensUsed || 0,
    responseTime: data.responseTime,
    success: data.success,
    error: data.error
  });
}

function logRequestComplete(context, data) {
  context.log.info('Caption request completed successfully', {
    requestId: data.requestId,
    userId: data.userId,
    totalDuration: data.totalDuration,
    captionLength: data.captionLength,
    success: true
  });
}

function logError(context, data) {
  context.log.error('Caption generation failed', {
    requestId: data.requestId,
    userId: data.userId,
    error: data.error,
    errorType: data.errorType || 'UnknownError'
  });
}

function logCarouselRequestStart(context, data) {
  context.log.info('Carousel generation started', {
    requestId: data.requestId,
    userId: data.userId,
    requestType: data.requestType,
    captionType: data.captionType,
    vibes: data.vibes,
    imageCount: data.imageCount,
    analysisMode: data.analysisMode,
    timestamp: data.timestamp
  });
}

function logCarouselRequestComplete(context, data) {
  context.log.info('Carousel generation completed successfully', {
    requestId: data.requestId,
    userId: data.userId,
    totalDuration: data.totalDuration,
    imageCount: data.imageCount,
    masterCaptionLength: data.masterCaptionLength,
    avgIndividualLength: data.avgIndividualLength,
    analysisQuality: data.analysisQuality,
    success: true
  });
}

module.exports = {
  getUserId,
  logRequestStart,
  logCarouselRequestStart,
  logAuthFailure,
  logImageProcessing,
  logLLMRequest,
  logLLMResponse,
  logRequestComplete,
  logCarouselRequestComplete,
  logError
};
