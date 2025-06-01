const OpenAI = require("openai");
const Sharp = require("sharp");

module.exports = async function (context, req) {
  context.log("→ GenerateCaption was called");
  
  // Add CORS headers to all responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key, x-caption-type",
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
  
  // Log headers for debugging
  context.log("Request headers:", JSON.stringify(req.headers, null, 2));

  if (req.method !== "POST") {
    context.res = { 
      status: 405, 
      headers: corsHeaders,
      body: { error: "Use POST with binary data." } 
    };
    return;
  }

  // Shared-secret check
  const SHARED_SECRET = process.env["SHARED_SECRET"];
  const incomingKey = (req.headers["x-api-key"] || "").toString();
  if (!incomingKey || incomingKey !== SHARED_SECRET) {
    context.log.warn("⛔ Unauthorized");
    context.res = { 
      status: 401, 
      headers: corsHeaders,
      body: { error: "Unauthorized" } 
    };
    return;
  }

  try {
    // Check content type
    if (req.headers["content-type"] !== "application/octet-stream") {
      throw new Error("Content-Type must be application/octet-stream");
    }

    context.log("▶ Processing raw binary upload");
    
    // Get caption type from custom header
    const captionType = req.headers["x-caption-type"] || "default";
    
    // Get the raw body as buffer - add more robust handling
    let fileBuffer;
    
    // Debug logging to see what we're getting
    context.log(`▶ req.rawBody type: ${typeof req.rawBody}, instanceof Buffer: ${req.rawBody instanceof Buffer}`);
    context.log(`▶ req.body type: ${typeof req.body}, instanceof Buffer: ${req.body instanceof Buffer}`);
    
    if (req.rawBody instanceof Buffer) {
      fileBuffer = req.rawBody;
      context.log("✓ rawBody is a Buffer");
    } else if (req.body instanceof Buffer) {
      fileBuffer = req.body;
      context.log("✓ body is a Buffer");
    } else if (req.rawBody) {
      // Try to convert from string if needed
      context.log(`⚠ rawBody is not a Buffer, trying to convert from ${typeof req.rawBody}`);
      fileBuffer = Buffer.from(req.rawBody, 'binary');
    } else if (req.body) {
      // Try req.body as fallback
      context.log(`⚠ body is not a Buffer, trying to convert from ${typeof req.body}`);
      fileBuffer = Buffer.from(req.body, 'binary');
    } else {
      throw new Error("No request body found (checked req.rawBody and req.body)");
    }
    
    context.log(`▶ Received raw image (bytes: ${fileBuffer.length})`);
    context.log(`▶ First 20 bytes (hex): ${fileBuffer.slice(0, 20).toString('hex')}`);
    context.log(`▶ Received captionType: ${captionType}`);

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

function getSystemInstructions(ct) {
  switch ((ct || "").toLowerCase()) {
    case "funny":
      return [
        "You are a Gen-Z/30s “mood” curator. Given an image, write a snappy, playful caption (1–2 sentences) that makes people double-tap. Use exactly one emoji—bonus points for something ironic, tongue-in-cheek, or meme-adjacent. Avoid being too wordy; keep it scroll-stopping.",
        "Example tone: “When coffee is life and mornings are not. ☕️”"
      ].join(" ");

    case "romantic":
      return [
        "You are a modern romantic poet who keeps it genuine. Given an image (solo or couple shot), craft a sweet but not cheesy caption (1–2 sentences) that captures the moment—think heartfelt but still light. Use exactly one emoji that feels warm (❤️, 🥰, or 🌹). Avoid clichés like “my other half”; focus on authentic feeling.",
        "Example tone: “Lost in your eyes and found everywhere I look. ❤️”"
      ].join(" ");

    case "motivational":
      return [
        "You are a motivational speaker who speaks like a close friend. Given an image (gym selfie, sunrise landscape, or hustle shot), write an uplifting caption (1–2 sentences) that inspires action or positivity. Use exactly one emoji to convey energy (🔥, 💪, or ✨). Keep it concise—think “fuel for your morning scroll.”",
        "Example tone: “Chase goals, not perfection. You got this. 💪”"
      ].join(" ");

    case "explain":
      return [
        "You are an ultra-visual explainer with a dash of personality. Given an image, describe what’s happening in 2–3 sentences—include context or background if it feels relevant (e.g., location, mood, color vibes). Write it so a friend scrolling Instagram would nod along, picturing the scene in their head. Skip generic phrases like “beautiful photo”; instead name the key details.",
        "Example tone: “Golden hour by the beach—waves kissing my feet while the skyline glows pink. Perfect escape from the 9-to-5 chaos.”"
      ].join(" ");

    default:
      return [
        "You are a creative caption guru for Instagram. Given an image, craft a short, engaging caption (1–2 sentences) that fits today’s trending aesthetic—mix relatable commentary with a single emoji that enhances the vibe (😉, 🌟, or 🤳). Throw in one subtle hashtag if it feels natural (e.g., #WeekendVibes, #CityLife), but keep it minimal so it doesn’t look cluttered.",
        "Example tone: “Sundays are for rooftop views and latte in hand. #WeekendVibes ☕️”"
      ].join(" ");
  }
}

    const instructions = getSystemInstructions(captionType);
    context.log("▶ System instructions:", instructions);

    const client = new OpenAI({ apiKey: process.env["OPENAI_API_KEY"] });
    context.log("▶ Calling OpenAI...");
    
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

    const caption = aiResponse.choices[0]?.message?.content?.trim() || "Could not generate caption";
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
    context.log.error("Error stack:", err.stack);
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
