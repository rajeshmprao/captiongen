const OpenAI = require("openai");
const Sharp = require("sharp");
const { generateCarouselInstructions, parseCarouselResponse } = require("./carouselPromptGenerator");
const telemetry = require("../GenerateCaption/telemetry");

function generateRequestId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

module.exports = async function (context, req) {
  const requestId = generateRequestId();
  const requestStartTime = Date.now();
  context.log.info({ requestId }, "GenerateCarouselCaption function invoked");
  
  // Add CORS headers to all responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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

    context.log.info({}, "Processing JSON payload for carousel");
    
    // Parse JSON body - expect images array instead of single image
    const { images, captionType = "default", vibes, apiKey } = req.body;
    
    if (!images || !Array.isArray(images) || images.length === 0 || !apiKey) {
      throw new Error("Missing required fields: images (array) and apiKey");
    }

    // Validate image count (2-3 images for now)
    if (images.length < 2 || images.length > 3) {
      throw new Error("Carousel requires 2-3 images");
    }

    // Shared-secret check
    const SHARED_SECRET = process.env["SHARED_SECRET"];
    if (apiKey !== SHARED_SECRET) {
      const userId = telemetry.getUserId(req);
      telemetry.logAuthFailure(context, { requestId, userId });
      context.log.warn({ requestId }, "Authorization failed");
      context.res = { 
        status: 401, 
        headers: corsHeaders,
        body: { error: "Unauthorized" } 
      };
      return;
    }

    // Generate user identifier for telemetry
    const userId = telemetry.getUserId(req);    // Log carousel request details with enhanced context
    telemetry.logRequestStart(context, {
      requestId,
      userId,
      requestType: vibes && Object.keys(vibes).length > 0 ? "carousel-vibes-enhanced" : "carousel-captionType-enhanced",
      captionType: captionType,
      vibes: vibes ? JSON.stringify(vibes) : null,
      imageCount: images.length,
      analysisMode: "photo-dump-enhanced",
      timestamp: new Date().toISOString()
    });

    context.log.info({ imageCount: images.length }, "Processing images for carousel");

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
        fileBuffer = Buffer.from(base64Data, 'base64');
        context.log.info({ 
          imageIndex: i + 1, 
          bufferSize: fileBuffer.length 
        }, "Converted base64 to buffer");
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
        imageFormat = 'png';
        context.log.info({ imageIndex: i + 1 }, "Detected PNG format");
      } else if (fileBuffer[0] === 0xFF && fileBuffer[1] === 0xD8) {
        imageFormat = 'jpeg';
        context.log.info({ imageIndex: i + 1 }, "Detected JPEG format");
      } else {
        context.log.warn({ 
          imageIndex: i + 1, 
          firstBytes: fileBuffer.slice(0, 4).toString('hex') 
        }, "Unknown image format detected");
      }      // Process with Sharp (optimized for photo dump analysis)
      context.log.info({ imageIndex: i + 1 }, "Processing image with Sharp");
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

      totalProcessedSize += resizedBuffer.length;
      context.log.info({ 
        imageIndex: i + 1, 
        originalSize: fileBuffer.length, 
        processedSize: resizedBuffer.length 
      }, "Image processing completed");

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
    context.log.info({}, "Calling OpenAI for carousel generation");
    
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
    context.log.info({ responseTime: llmEndTime - llmStartTime }, "OpenAI response received");

    if (!aiResponse.choices || aiResponse.choices.length === 0) {
      throw new Error("No response from AI service");
    }

    const rawCaption = aiResponse.choices[0].message?.content;
    if (!rawCaption) {
      throw new Error("Empty response from AI service");
    }

    context.log.info({}, "Parsing carousel response");
    
    // Parse the structured response into master + individual captions
    const carouselResult = parseCarouselResponse(rawCaption, images.length);    // Log successful completion with enhanced analysis metrics
    const totalTime = Date.now() - requestStartTime;    context.log.info({
      requestId,
      userId,
      imageCount: images.length,
      totalTime,
      llmTime: llmEndTime - llmStartTime,
      analysisQuality: carouselResult.analysisQuality || 'structured',
      masterCaptionLength: carouselResult.masterCaption.length,
      avgIndividualLength: Math.round(carouselResult.individualCaptions.reduce((acc, cap) => acc + cap.length, 0) / carouselResult.individualCaptions.length)
    }, "Enhanced carousel caption generated successfully");

    context.res = {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      body: carouselResult
    };

  } catch (error) {
    const userId = telemetry.getUserId(req);    context.log.error({
      requestId,
      userId,
      error: error.message,
      stack: error.stack
    }, "Error in GenerateCarouselCaption");

    const totalTime = Date.now() - requestStartTime;
    
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: { 
        error: process.env.NODE_ENV === 'development' 
          ? error.message 
          : "Internal server error generating carousel caption",
        requestId,
        totalTime
      }
    };
  }
};
