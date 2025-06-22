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
  context.log.info(
    {
      requestId: data.requestId,
      userId: data.userId,
      requestType: data.requestType,
      captionType: data.captionType,
      vibes: data.vibes,
      timestamp: data.timestamp
    },
    'Caption request started'
  );
}

function logAuthFailure(context, data) {
  context.log.warn(
    {
      requestId: data.requestId,
      userId: data.userId,
      timestamp: new Date().toISOString()
    },
    'Authentication failed'
  );
}

function logImageProcessing(context, data) {
  context.log.info(
    {
      requestId: data.requestId,
      userId: data.userId,
      originalFormat: data.originalFormat,
      originalSize: data.originalSize,
      processedSize: data.processedSize
    },
    'Image processing completed'
  );
}

function logLLMRequest(context, data) {
  context.log.info(
    {
      requestId: data.requestId,
      userId: data.userId,
      promptLength: data.promptLength,
      imageSize: data.imageSize
    },
    'LLM request initiated'
  );
}

function logLLMResponse(context, data) {
  context.log.info(
    {
      requestId: data.requestId,
      userId: data.userId,
      tokensUsed: data.tokensUsed || 0,
      responseTime: data.responseTime,
      success: data.success,
      error: data.error
    },
    'LLM response received'
  );
}

function logRequestComplete(context, data) {
  context.log.info(
    {
      requestId: data.requestId,
      userId: data.userId,
      totalDuration: data.totalDuration,
      captionLength: data.captionLength,
      success: true
    },
    'Caption request completed successfully'
  );
}

function logError(context, data) {
  context.log.error(
    {
      requestId: data.requestId,
      userId: data.userId,
      error: data.error,
      errorType: data.errorType || 'UnknownError'
    },
    'Caption generation failed'
  );
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
