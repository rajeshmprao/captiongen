const OpenAI = require("openai");
const Sharp = require("sharp");
const { generateInstructions } = require("./promptGenerator");

module.exports = async function (context, req) {
  const requestId = generateRequestId();
  context.log("→ GenerateCaption was called", { requestId });
  
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

    context.log("▶ Processing JSON payload");
    
    // Parse JSON body - support both legacy and new formats
    const { image, captionType = "default", vibes, apiKey } = req.body;
    
    if (!image || !apiKey) {
      throw new Error("Missing required fields: image and apiKey");
    }

    // Log user request details
    context.log("CaptionRequest", {
      requestId,
      requestType: vibes && Object.keys(vibes).length > 0 ? "vibes" : "captionType",
      captionType: captionType,
      vibes: vibes ? JSON.stringify(vibes) : null,
      timestamp: new Date().toISOString()
    });

    // Shared-secret check
    const SHARED_SECRET = process.env["SHARED_SECRET"];
    if (apiKey !== SHARED_SECRET) {
      context.log.warn("⛔ Unauthorized", { requestId });
      context.res = { 
        status: 401, 
        headers: corsHeaders,
        body: { error: "Unauthorized" } 
      };
      return;
    }

    // Convert base64 to buffer
    let fileBuffer;
    try {
      // Remove data URL prefix if present (data:image/jpeg;base64,)
      const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
      fileBuffer = Buffer.from(base64Data, 'base64');
      context.log(`▶ Converted base64 to buffer (bytes: ${fileBuffer.length})`);
    } catch (base64Error) {
      throw new Error("Invalid base64 image data");
    }

    // Validate the buffer before processing
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("Image buffer is empty");
    }

    // Try to detect the actual image format
    let imageFormat = 'jpeg';
    if (fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50) {
      imageFormat = 'png';
      context.log("▶ Detected PNG format");
    } else if (fileBuffer[0] === 0xFF && fileBuffer[1] === 0xD8) {
      imageFormat = 'jpeg';
      context.log("▶ Detected JPEG format");
    } else {
      context.log(`⚠ Unknown image format. First bytes: ${fileBuffer.slice(0, 4).toString('hex')}`);
    }

    // Convert image to data URI
    let resizedBuffer;
    try {
      // First, try to just read the metadata to see if Sharp can handle the file
      const metadata = await Sharp(fileBuffer).metadata();
      context.log(`▶ Image metadata: format=${metadata.format}, width=${metadata.width}, height=${metadata.height}`);
      
      // Now try to process it
      resizedBuffer = await Sharp(fileBuffer)
        .resize({ width: 512, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (sharpError) {
      context.log.error("Sharp processing error:", sharpError);
      
      // Try a fallback approach - just use the original buffer if it's not too large
      if (fileBuffer.length < 5 * 1024 * 1024) { // 5MB limit
        context.log("▶ Using original image without resizing");
        resizedBuffer = fileBuffer;
      } else {
        throw sharpError;
      }
    }

    // Compute Base64
    const base64Image = resizedBuffer.toString("base64");
    const imageData = `data:image/jpeg;base64,${base64Image}`;

    // Generate instructions using new modular system
    const instructions = generateInstructions(captionType, vibes);
    
    // Log the final prompt sent to LLM
    context.log("LLMPrompt", {
      requestId,
      promptLength: instructions.length,
      imageSize: resizedBuffer.length
    });

    const client = new OpenAI({ apiKey: process.env["OPENAI_API_KEY"] });
    context.log("▶ Calling OpenAI...");
    
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
    });

    const llmDuration = Date.now() - llmStartTime;
    const caption = aiResponse.choices[0]?.message?.content?.trim() || "Could not generate caption";
    
    // Log LLM response metrics
    context.log("LLMResponse", {
      requestId,
      tokensUsed: aiResponse.usage?.total_tokens || 0,
      responseTime: llmDuration,
      success: true
    });

    context.log("▶ Generated caption:", caption);

    context.res = {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      },
      body: { caption }
    };
  } catch (err) {
    context.log.error("❗ Error in GenerateCaption:", err);
    
    // Log error with request context
    context.log("LLMResponse", {
      requestId,
      success: false,
      error: err.message
    });
    
    context.res = { 
      status: 500,
      headers: corsHeaders,
      body: { 
        error: "Caption generation failed.",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      } 
    };
  }
};

function generateRequestId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
