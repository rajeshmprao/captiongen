const AuthMiddleware = require("../services/AuthMiddleware");

function generateRequestId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

module.exports = async function (context, req) {
  const requestId = generateRequestId();
  const requestStartTime = Date.now();
  context.log.info("UserAuth function invoked", { requestId });
    const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };

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
    if (!req.headers["content-type"]?.includes("application/json")) {
      throw new Error("Content-Type must be application/json");
    }    const authMiddleware = new AuthMiddleware();
    const { firebaseIdToken } = req.body;

    if (!firebaseIdToken) {
      throw new Error("Missing Firebase ID token");
    }

    // Validate Firebase ID token
    const firebaseUserData = await authMiddleware.validateFirebaseToken(firebaseIdToken);

    if (!firebaseUserData) {
      throw new Error("Firebase authentication failed");
    }

    // Generate JWT token using AuthMiddleware
    const tokenData = await authMiddleware.generateJwtToken(firebaseUserData);    context.log.info("JWT token generated successfully", { 
      requestId, 
      userId: firebaseUserData.userId,
      authType: 'firebase'
    });

    const totalDuration = Date.now() - requestStartTime;

    context.res = {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      },
      body: {
        success: true,
        message: "Authentication successful",
        data: tokenData,
        debugInfo: {
          requestId,
          timestamp: new Date().toISOString(),
          duration: totalDuration,
          functionName: 'UserAuth'
        }
      }
    };

  } catch (err) {    context.log.error("Authentication failed", { 
      requestId, 
      error: err.message,
      errorType: 'AuthenticationError'
    });
    
    const totalDuration = Date.now() - requestStartTime;
    
    context.res = { 
      status: 401,
      headers: corsHeaders,
      body: { 
        success: false,
        error: "Authentication failed",
        message: err.message,
        debugInfo: {
          requestId,
          timestamp: new Date().toISOString(),
          duration: totalDuration,
          errorType: err.name || 'AuthenticationError',
          functionName: 'UserAuth'
        }
      } 
    };
  }
};
