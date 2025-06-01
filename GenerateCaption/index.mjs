import OpenAI from "openai";
import Busboy from "busboy";

export default async function generateCaption(context, req) {
  context.log("→ GenerateCaption function was called");

  // Only accept POST
  if (req.method !== "POST") {
    context.res = {
      status: 405,
      body: { error: "Method Not Allowed. Use POST with form-data." },
    };
    return;
  }

//   Shared secret check (optional, but recommended for private use)
  const SHARED_SECRET = process.env["SHARED_SECRET"];
  const incomingKey = (req.headers["x-api-key"] || "").toString();
  if (!incomingKey || incomingKey !== SHARED_SECRET) {
    context.log.warn("⛔ Unauthorized: missing/invalid x-api-key header");
    context.res = { status: 401, body: { error: "Unauthorized" } };
    return;
  }

  try {
    // Create a promise so we can await Busboy's parsing
    const { fileBuffer, fileMime, captionType } = await new Promise((resolve, reject) => {
      const busboy = new Busboy({ headers: req.headers });
      let fileBuffer = Buffer.alloc(0);
      let fileMime = "";
      let cType = "default";

      busboy.on("file", (fieldname, fileStream, filename, encoding, mimetype) => {
        if (fieldname === "image") {
          fileMime = mimetype;
          const chunks = [];
          fileStream.on("data", (data) => {
            chunks.push(data);
          });
          fileStream.on("end", () => {
            fileBuffer = Buffer.concat(chunks);
          });
        } else {
          // ignore other file fields
          fileStream.resume();
        }
      });

      busboy.on("field", (fieldname, val) => {
        if (fieldname === "captionType") {
          cType = val.toString();
        }
      });

      busboy.on("finish", () => {
        if (!fileBuffer || fileBuffer.length === 0) {
          reject(new Error("No file detected in field 'image'."));
        } else {
          resolve({ fileBuffer, fileMime, captionType: cType });
        }
      });

      busboy.on("error", (err) => {
        reject(err);
      });

      // `req` in Azure Functions has a `rawBody` Buffer
      busboy.end(req.rawBody);
    });

    context.log("▶ Received image file (bytes):", fileBuffer.length, "mime:", fileMime);
    context.log("▶ Received captionType:", captionType);

    // Convert image buffer to base64 data URI
    const base64Image = fileBuffer.toString("base64");
    const imageData = `data:${fileMime};base64,${base64Image}`;

    // Choose system instructions based on captionType
    function getSystemInstructions(ct) {
      switch ((ct || "").toLowerCase()) {
        case "funny":
          return "You are a witty Instagram caption writer. Given a base64-encoded image, produce a short, funny caption (1–2 sentences, use exactly one emoji).";
        case "romantic":
          return "You are a romantic poet. Given a base64-encoded image, produce a sweet, romantic caption (1–2 sentences, use exactly one emoji).";
        case "motivational":
          return "You are a motivational speaker. Given a base64-encoded image, produce an uplifting, motivational caption (1–2 sentences, use exactly one emoji).";
        default:
          return "You are a creative Instagram caption writer. Given a base64-encoded image, produce a short, clever caption (1–2 sentences, use exactly one emoji).";
      }
    }

    const instructions = getSystemInstructions(captionType);
    context.log("▶ System instructions:", instructions);

    // Initialize and call OpenAI
    const client = new OpenAI({
      apiKey: process.env["OPENAI_API_KEY"], // Provided by Function App Settings
    });

    context.log("▶ Calling OpenAI...");
    const aiResponse = await client.responses.create({
      model: "gpt-4.1", // or "gpt-4o-mini"
      instructions,
      input: imageData,
      temperature: 0.8,   // creativity
      max_output_tokens: 100,     // length cap
    });

    const caption = (aiResponse.output_text || "").trim();
    context.log("▶ Generated caption:", caption);

    // Send back JSON
    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { caption },
    };
  } catch (err) {
    context.log.error("❗ Error in GenerateCaption:", err);
    context.res = {
      status: 500,
      body: { error: "Caption generation failed." },
    };
  }
}