const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const crypto = require('crypto');
const UserService = require('./UserService');

class AuthMiddleware {
  constructor() {
    this.userService = new UserService();
    this.jwtSecret = process.env.JWT_SECRET;
    
    // Initialize Firebase Admin SDK if not already initialized
    if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      });
    }
  }

  async authenticateRequest(req) {
    try {
      // Check for JWT token first (new auth method)
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        return await this.validateJwtToken(token);
      }

      // Fallback to legacy apiKey method for backward compatibility
      if (req.body && req.body.apiKey) {
        return await this.validateLegacyApiKey(req.body.apiKey, req);
      }

      return null;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  async validateJwtToken(token) {
    try {
      // Verify JWT signature and expiration
      const decoded = jwt.verify(token, this.jwtSecret);
      
      // Check if session exists and is not revoked
      const session = await this.userService.getSession(decoded.jti);
      if (!session || session.IsRevoked) {
        throw new Error('Session revoked or not found');
      }

      // Check if session has expired
      if (new Date(session.ExpiresAt) < new Date()) {
        throw new Error('Session expired');
      }

      // Get user data
      const user = await this.userService.getUser(decoded.sub);
      if (!user || !user.IsActive) {
        throw new Error('User not found or inactive');
      }

      // Update session last used timestamp
      await this.updateSessionLastUsed(decoded.jti);

      return {
        userId: decoded.sub,
        email: decoded.email,
        sessionId: decoded.jti,
        user: user
      };
    } catch (error) {
      throw new Error(`JWT validation failed: ${error.message}`);
    }
  }

  async validateLegacyApiKey(apiKey, req) {
    // Validate against the stored shared secret
    const sharedSecret = process.env.SHARED_SECRET;
    
    if (!apiKey || !sharedSecret) {
      return null;
    }

    // Check if the provided API key matches the shared secret
    if (apiKey.trim() !== sharedSecret) {
      return null;
    }

    // Generate unique legacy user ID based on request headers for analytics
    const userAgent = req.headers['user-agent'] || 'unknown';
    const acceptLanguage = req.headers['accept-language'] || 'unknown';
    const clientFingerprint = `${userAgent}_${acceptLanguage}`;
    const legacyUserId = `legacy_${crypto.createHash('md5').update(clientFingerprint).digest('hex').substring(0, 8)}`;

    // Create a user object for legacy requests with tracking enabled
    return {
      userId: legacyUserId,
      email: `${legacyUserId}@legacy.local`,
      sessionId: null, // No session tracking for legacy users
      isLegacyUser: true, // Flag to identify legacy users
      user: {
        PartitionKey: 'user',
        RowKey: legacyUserId,
        Email: `${legacyUserId}@legacy.local`,
        DisplayName: 'Legacy Android User',
        SubscriptionTier: 'legacy',
        UsageLimit: -1, // -1 indicates unlimited usage
        TotalUsage: 0,
        MonthlyUsage: 0,
        IsActive: true
      }
    };
  }
  async validateFirebaseToken(firebaseIdToken) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);
      return {
        userId: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        emailVerified: decodedToken.email_verified
      };
    } catch (error) {
      throw new Error(`Firebase token validation failed: ${error.message}`);
    }
  }
  async generateJwtToken(firebaseUserData) {try {
      // Ensure user exists in database
      let user = await this.userService.getUser(firebaseUserData.userId);
      if (!user) {
        await this.userService.createUser(firebaseUserData.userId, firebaseUserData);
        user = await this.userService.getUser(firebaseUserData.userId);
      } else {
        // Update last login
        await this.userService.updateUserLogin(firebaseUserData.userId);
      }

      // Generate JWT token
      const jwtId = require('uuid').v4();
      const payload = {
        sub: firebaseUserData.userId,
        email: firebaseUserData.email,
        jti: jwtId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
      };

      const token = jwt.sign(payload, this.jwtSecret);

      // Create session record
      await this.userService.createSession(firebaseUserData.userId, jwtId, 'web');

      return {
        token: token,
        expiresIn: 3600,
        user: {
          id: user.RowKey,
          email: user.Email,
          displayName: user.DisplayName,
          profilePicture: user.ProfilePicture,
          subscriptionTier: user.SubscriptionTier
        }
      };
    } catch (error) {
      throw new Error(`JWT generation failed: ${error.message}`);
    }
  }

  async updateSessionLastUsed(jwtId) {
    try {
      const session = await this.userService.getSession(jwtId);
      if (session) {
        session.LastUsed = new Date().toISOString();
        const entity = this.userService.convertObjectToEntity(session);
        
        await new Promise((resolve, reject) => {
          this.userService.tableService.replaceEntity('UserSessions', entity, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
        });
      }
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to update session last used:', error);
    }
  }

  async checkUsageLimit(userId, isLegacyUser = false) {
    // Legacy users have unlimited usage
    if (isLegacyUser) {
      return true;
    }

    const stats = await this.userService.getUserUsageStats(userId);
    if (!stats) return false;

    return stats.remainingUsage > 0;
  }

  createAuthResponse(status, message, data = null) {
    return {
      status: status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: {
        success: status < 400,
        message: message,
        data: data
      }
    };
  }
}

module.exports = AuthMiddleware;
