const OpenAI = require("openai");
const Sharp = require("sharp");
const { generateCarouselInstructions, parseCarouselResponse } = require("./carouselPromptGenerator");
const telemetry = require("../GenerateCaption/telemetry");
const AuthMiddleware = require("../services/AuthMiddleware");

function generateRequestId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

module.exports = async function (context, req) {
  const requestId = generateRequestId();
  const requestStartTime = Date.now();
  let userId = 'unknown'; // Declare at function scope for error handling
  context.log.info("GenerateCarouselCaption function invoked", { requestId });
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

    context.log.info("Processing JSON payload for carousel");
    
    // Parse JSON body - expect images array instead of single image
    const { images, captionType = "default", vibes } = req.body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error("Missing required field: images (array)");
    }

    // Validate image count (2-3 images for now)
    if (images.length < 2 || images.length > 3) {
      throw new Error("Carousel requires 2-3 images");    }    // Generate user identifier for telemetry (use authenticated user ID)
    userId = authResult.userId;    // Log carousel request details with enhanced context
    telemetry.logCarouselRequestStart(context, {
      requestId,
      userId,
      requestType: vibes && Object.keys(vibes).length > 0 ? "carousel-vibes-enhanced" : "carousel-captionType-enhanced",
      captionType: captionType,
      vibes: vibes ? JSON.stringify(vibes) : null,
      imageCount: images.length,
      analysisMode: "photo-dump-enhanced",
      timestamp: new Date().toISOString()
    });

    context.log.info("Processing images for carousel", { imageCount: images.length });

    // Process all images
    const processedImages = [];
    let totalOriginalSize = 0;
    let totalProcessedSize = 0;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      // Convert base64 to buffer
      let fileBuffer;
      try {
        // Remove data URL prefix if present (data:image/jpeg;base64,)
        const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
        fileBuffer = Buffer.from(base64Data, 'base64');        context.log.info("Converted base64 to buffer", { 
          imageIndex: i + 1, 
          bufferSize: fileBuffer.length 
        });
        totalOriginalSize += fileBuffer.length;
      } catch (base64Error) {
        throw new Error(`Invalid base64 image data for image ${i + 1}`);
      }

      // Validate the buffer before processing
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error(`Image ${i + 1} buffer is empty`);
      }

      // Detect image format
      let imageFormat = 'jpeg';
      if (fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50) {
        imageFormat = 'png';        context.log.info("Detected PNG format", { imageIndex: i + 1 });
      } else if (fileBuffer[0] === 0xFF && fileBuffer[1] === 0xD8) {
        imageFormat = 'jpeg';
        context.log.info("Detected JPEG format", { imageIndex: i + 1 });
      } else {
        context.log.warn("Unknown image format detected", { 
          imageIndex: i + 1, 
          firstBytes: fileBuffer.slice(0, 4).toString('hex') 
        });
      }      // Process with Sharp (optimized for photo dump analysis)
      context.log.info("Processing image with Sharp", { imageIndex: i + 1 });
      const resizedBuffer = await Sharp(fileBuffer)
        .resize(768, 768, { // Increased resolution for better photo dump context
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: 85, // Higher quality for better detail recognition
          progressive: true,
          mozjpeg: true 
        })
        .toBuffer();

      totalProcessedSize += resizedBuffer.length;      context.log.info("Image processing completed", { 
        imageIndex: i + 1, 
        originalSize: fileBuffer.length, 
        processedSize: resizedBuffer.length 
      });

      // Convert to base64 for OpenAI
      const imageData = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
      processedImages.push(imageData);
    }

    // Log image processing telemetry
    telemetry.logImageProcessing(context, {
      requestId,
      userId,
      originalFormat: "multi-image",
      originalSize: totalOriginalSize,
      processedSize: totalProcessedSize
    });

    // Generate carousel instructions
    const instructions = generateCarouselInstructions(captionType, vibes, images.length);
    
    // Log the final prompt sent to LLM
    telemetry.logLLMRequest(context, {
      requestId,
      userId,
      promptLength: instructions.length,
      imageSize: totalProcessedSize
    });

    const client = new OpenAI({ apiKey: process.env["OPENAI_API_KEY"] });
    context.log.info("Calling OpenAI for carousel generation");
    
    const llmStartTime = Date.now();
      // Create messages array with all images - use higher detail for better photo dump analysis
    const userContent = processedImages.map(imageData => ({
      type: "image_url",
      image_url: {
        url: imageData,
        detail: "high" // Changed from "low" to "high" for better multi-image context analysis
      }
    }));// Use the correct OpenAI API format for vision with multiple images
    // Enhanced parameters for better photo dump analysis
    const aiResponse = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: instructions
        },
        {
          role: "user",
          content: userContent
        }
      ],
      max_tokens: 400, // Increased for more detailed analysis
      temperature: 0.75, // Slightly higher for more creative photo dump captions
      top_p: 0.9, // Added for better response diversity
      presence_penalty: 0.1, // Slight penalty to avoid repetition across captions
      frequency_penalty: 0.1 // Encourage varied vocabulary
    });

    const llmEndTime = Date.now();
    context.log.info("OpenAI response received", { responseTime: llmEndTime - llmStartTime });

    if (!aiResponse.choices || aiResponse.choices.length === 0) {
      throw new Error("No response from AI service");
    }

    const rawCaption = aiResponse.choices[0].message?.content;
    if (!rawCaption) {
      throw new Error("Empty response from AI service");
    }

    context.log.info("Parsing carousel response");
    
    // Parse the structured response into master + individual captions
    const carouselResult = parseCarouselResponse(rawCaption, images.length);    // Log successful completion with enhanced analysis metrics
    const totalTime = Date.now() - requestStartTime;
    
    context.log.info("Enhanced carousel caption generated successfully", {
      requestId,
      userId,
      imageCount: images.length,
      totalTime,
      llmTime: llmEndTime - llmStartTime,
      analysisQuality: carouselResult.analysisQuality || 'structured',
      masterCaptionLength: carouselResult.masterCaption.length,
      avgIndividualLength: Math.round(carouselResult.individualCaptions.reduce((acc, cap) => acc + cap.length, 0) / carouselResult.individualCaptions.length)
    });

    // Log carousel completion telemetry
    telemetry.logCarouselRequestComplete(context, {
      requestId,
      userId,
      totalDuration: totalTime,
      imageCount: images.length,
      masterCaptionLength: carouselResult.masterCaption.length,
      avgIndividualLength: Math.round(carouselResult.individualCaptions.reduce((acc, cap) => acc + cap.length, 0) / carouselResult.individualCaptions.length),
      analysisQuality: carouselResult.analysisQuality || 'structured'
    });

    // Track usage for all authenticated users (including legacy users)
    try {
      const userService = authMiddleware.userService;
      const totalImages = images.length;
      const totalTokens = aiResponse.usage?.total_tokens || 0;
      const totalImageSize = processedImages.reduce((sum, img) => sum + img.size, 0);
      
      await userService.trackUsage(
        authResult.userId, 
        'carousel', 
        totalTokens, 
        totalImageSize, 
        true,
        requestId  // Pass requestId for correlation with Application Insights
      );      
      context.log.info("Carousel usage tracked successfully", { 
        userId: authResult.userId, 
        tokensUsed: totalTokens,
        imageCount: totalImages,
        userType: authResult.isLegacyUser ? 'legacy' : 'firebase'
      });
    } catch (usageError) {
      context.log.error("Failed to track carousel usage", { error: usageError.message });
      // Don't fail the request if usage tracking fails
    }

    context.res = {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      body: carouselResult
    };

  } catch (error) {
    // Use the authenticated user ID for error logging
    const errorUserId = typeof authResult !== 'undefined' ? authResult.userId : 'unknown';
      context.log.error("Error in GenerateCarouselCaption", {
      requestId,
      userId: errorUserId,
      error: error.message,
      stack: error.stack
    });

    const totalTime = Date.now() - requestStartTime;
      context.res = {
      status: 500,
      headers: corsHeaders,
      body: { 
        error: process.env.NODE_ENV === 'development' 
          ? error.message 
          : "Internal server error generating carousel caption",
        debugInfo: {
          requestId,
          timestamp: new Date().toISOString(),
          duration: totalTime,
          errorType: error.name || 'Error',
          functionName: 'GenerateCarouselCaption'
        }
      }
    };
  }
};
