const OpenAI = require("openai");
const Sharp = require("sharp");
const { generateInstructions } = require("./promptGenerator");
const telemetry = require("./telemetry");
const AuthMiddleware = require("../services/AuthMiddleware");

module.exports = async function (context, req) {
  const requestId = generateRequestId();
  const requestStartTime = Date.now();
  let userId = 'unknown'; // Declare at function scope for error handling
  let authResult = null;
  
  context.log.info("GenerateCaption function invoked", { requestId });
    // Add CORS headers to all responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    context.res = {
      status: 204,
      headers: corsHeaders,
      body: null
    };
    return;
  }

  if (req.method !== "POST") {
    context.res = { 
      status: 405, 
      headers: corsHeaders,
      body: { error: "Use POST with JSON data." } 
    };
    return;
  }
  try {
    // Check content type
    if (!req.headers["content-type"]?.includes("application/json")) {
      throw new Error("Content-Type must be application/json");
    }

    // Authenticate request - support both JWT and legacy apiKey
    const authMiddleware = new AuthMiddleware();
    const authResult = await authMiddleware.authenticateRequest(req);
    
    if (!authResult) {
      throw new Error("Authentication required. Please provide valid authorization or API key.");
    }    context.log.info("Request authenticated successfully", { 
      requestId, 
      userId: authResult.userId,
      authMethod: authResult.sessionId ? 'jwt' : 'apikey',
      isLegacy: authResult.isLegacyUser || false
    });

    // Check usage limits (legacy users have unlimited access)
    const hasUsageLeft = await authMiddleware.checkUsageLimit(authResult.userId, authResult.isLegacyUser);
    if (!hasUsageLeft) {
      throw new Error("Usage limit exceeded. Please upgrade your plan or try again next month.");
    }

    context.log.info("Processing JSON payload");
    // Parse JSON body - support both legacy and new formats
    const { image, captionType = "default", vibes } = req.body;
    
    if (!image) {
      throw new Error("Missing required field: image");
    }    // Generate user identifier for telemetry (use authenticated user ID)
    userId = authResult.userId;

    // Log user request details
    telemetry.logRequestStart(context, {
      requestId,
      userId,
      requestType: vibes && Object.keys(vibes).length > 0 ? "vibes" : "captionType",      captionType: captionType,
      vibes: vibes ? JSON.stringify(vibes) : null,
      timestamp: new Date().toISOString()
    });

    // Convert base64 to buffer
    let fileBuffer;
    try {
      // Remove data URL prefix if present (data:image/jpeg;base64,)
      const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
      fileBuffer = Buffer.from(base64Data, 'base64');
      context.log.info("Converted base64 to buffer", { bufferSize: fileBuffer.length });
    } catch (base64Error) {
      throw new Error("Invalid base64 image data");
    }

    // Validate the buffer before processing
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("Image buffer is empty");
    }    // Try to detect the actual image format
    let imageFormat = 'jpeg';
    if (fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50) {
      imageFormat = 'png';      context.log.info("Detected PNG format");
    } else if (fileBuffer[0] === 0xFF && fileBuffer[1] === 0xD8) {
      imageFormat = 'jpeg';
      context.log.info("Detected JPEG format");
    } else {
      context.log.warn("Unknown image format detected", { firstBytes: fileBuffer.slice(0, 4).toString('hex') });
    }

    const originalSize = fileBuffer.length;

    // Convert image to data URI
    let resizedBuffer;
    try {
      // First, try to just read the metadata to see if Sharp can handle the file
      const metadata = await Sharp(fileBuffer).metadata();      context.log.info("Image metadata extracted", { 
        format: metadata.format, 
        width: metadata.width, 
        height: metadata.height 
      });
      
      // Now try to process it
      resizedBuffer = await Sharp(fileBuffer)
        .resize({ width: 512, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (sharpError) {      context.log.error("Sharp processing failed", { error: sharpError.message });
      
      // Try a fallback approach - just use the original buffer if it's not too large
      if (fileBuffer.length < 5 * 1024 * 1024) { // 5MB limit
        context.log.info("Using original image without resizing");
        resizedBuffer = fileBuffer;
      } else {
        throw sharpError;
      }
    }    // Compute Base64
    const base64Image = resizedBuffer.toString("base64");
    const imageData = `data:image/jpeg;base64,${base64Image}`;

    // Log image processing telemetry
    telemetry.logImageProcessing(context, {
      requestId,
      userId,
      originalFormat: imageFormat,
      originalSize: originalSize,
      processedSize: resizedBuffer.length
    });    // Generate instructions using new modular system
    const instructions = generateInstructions(captionType, vibes);
    
    // Log the final prompt sent to LLM
    telemetry.logLLMRequest(context, {
      requestId,
      userId,
      promptLength: instructions.length,
      imageSize: resizedBuffer.length
    });

    const client = new OpenAI({ apiKey: process.env["OPENAI_API_KEY"] });
    context.log.info("Calling OpenAI API");
    
    const llmStartTime = Date.now();
    
    // Use the correct OpenAI API format for vision with gpt-4o
    const aiResponse = await client.chat.completions.create({
      model: "gpt-4.1",  // Fix: Use correct model name
      messages: [
        {
          role: "system",
          content: instructions
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageData,
                detail: "low"  // Use "low" for faster/cheaper processing
              }
            }
          ]
        }
      ],
      max_tokens: 100,
      temperature: 0.8
    });    const llmDuration = Date.now() - llmStartTime;
    const caption = aiResponse.choices[0]?.message?.content?.trim() || "Could not generate caption";
    
    // Log LLM response metrics
    telemetry.logLLMResponse(context, {      requestId,
      userId,
      tokensUsed: aiResponse.usage?.total_tokens || 0,
      responseTime: llmDuration,
      success: true
    });

    context.log.info("Caption generated successfully", { captionLength: caption.length });

    // Track usage for all authenticated users (including legacy users)
    try {
      const userService = authMiddleware.userService;
      await userService.trackUsage(
        authResult.userId, 
        'caption', 
        aiResponse.usage?.total_tokens || 0, 
        resizedBuffer.length, 
        true,
        requestId  // Pass requestId for correlation with Application Insights
      );      
      context.log.info("Usage tracked successfully", { 
        userId: authResult.userId, 
        tokensUsed: aiResponse.usage?.total_tokens || 0,
        userType: authResult.isLegacyUser ? 'legacy' : 'firebase'
      });
    } catch (usageError) {
      context.log.error("Failed to track usage", { error: usageError.message });
      // Don't fail the request if usage tracking fails
    }

    // Log successful request completion
    const totalDuration = Date.now() - requestStartTime;
    telemetry.logRequestComplete(context, {
      requestId,
      userId,
      totalDuration,
      captionLength: caption.length
    });

    context.res = {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      },
      body: { caption }
    };
  } catch (err) {
    // Log error with request context
    telemetry.logError(context, {
      requestId,
      userId: userId || 'unknown',
      error: err.message,
      errorType: 'CaptionGenerationError'
    });
    
    telemetry.logLLMResponse(context, {
      requestId,
      userId: userId || 'unknown',
      success: false,
      error: err.message,
      responseTime: 0
    });
      const totalDuration = Date.now() - requestStartTime;
    
    context.res = { 
      status: 500,
      headers: corsHeaders,
      body: { 
        error: "Caption generation failed.",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
        debugInfo: {
          requestId,
          timestamp: new Date().toISOString(),
          duration: totalDuration,
          errorType: err.name || 'Error',
          functionName: 'GenerateCaption'
        }
      } 
    };
  }
};

function generateRequestId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
