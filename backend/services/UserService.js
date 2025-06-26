const azure = require('azure-storage');
const { v4: uuidv4 } = require('uuid');

class UserService {
  constructor() {
    this.tableService = azure.createTableService(process.env.STORAGE_CONNECTION_STRING);
    this.tablesInitialized = false;
  }

  async ensureTablesExist() {
    if (this.tablesInitialized) return;
    
    console.log('UserService: Initializing tables...');
    console.log('UserService: Storage connection string:', process.env.STORAGE_CONNECTION_STRING ? 'Present' : 'Missing');
    
    const tables = ['Users', 'UserSessions', 'UserUsage'];
    for (const tableName of tables) {
      await new Promise((resolve, reject) => {
        this.tableService.createTableIfNotExists(tableName, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
    this.tablesInitialized = true;
  }  async createUser(firebaseUserId, userData) {
    await this.ensureTablesExist();
    
    const user = {
      PartitionKey: 'user',
      RowKey: firebaseUserId,
      Email: userData.email,
      DisplayName: userData.name || '',
      ProfilePicture: userData.picture || '',
      CreatedAt: new Date().toISOString(),
      LastLogin: new Date().toISOString(),
      IsActive: true,
      SubscriptionTier: 'free',
      TotalUsage: 0,
      MonthlyUsage: 0,
      UsageLimit: 50
    };

    return new Promise((resolve, reject) => {
      this.tableService.insertOrReplaceEntity('Users', user, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }  async getUser(firebaseUserId) {
    await this.ensureTablesExist();
    
    return new Promise((resolve, reject) => {
      this.tableService.retrieveEntity('Users', 'user', firebaseUserId, (error, result) => {
        if (error) {
          if (error.statusCode === 404) resolve(null);
          else reject(error);
        } else {
          resolve(this.convertEntityToObject(result));
        }
      });
    });
  }
  async updateUserLogin(firebaseUserId) {
    const user = await this.getUser(firebaseUserId);
    if (!user) return null;

    user.LastLogin = new Date().toISOString();
    
    return new Promise((resolve, reject) => {
      const entity = this.convertObjectToEntity(user);
      this.tableService.replaceEntity('Users', entity, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }

  async createSession(userId, jwtId, clientType = 'web', requestId = null) {
    const session = {
      PartitionKey: 'session',
      RowKey: jwtId,
      RequestId: requestId, // Correlation ID for Application Insights
      UserId: userId,
      CreatedAt: new Date().toISOString(),
      ExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      ClientType: clientType,
      IsRevoked: false,
      LastUsed: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      this.tableService.insertEntity('UserSessions', session, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }
  async getSession(jwtId) {
    await this.ensureTablesExist();
    
    return new Promise((resolve, reject) => {
      this.tableService.retrieveEntity('UserSessions', 'session', jwtId, (error, result) => {
        if (error) {
          if (error.statusCode === 404) resolve(null);
          else reject(error);
        } else {
          resolve(this.convertEntityToObject(result));
        }
      });
    });
  }

  async revokeSession(jwtId) {
    const session = await this.getSession(jwtId);
    if (!session) return null;

    session.IsRevoked = true;
    
    return new Promise((resolve, reject) => {
      const entity = this.convertObjectToEntity(session);
      this.tableService.replaceEntity('UserSessions', entity, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }

  async trackUsage(userId, requestType, tokensUsed, imageSize, success = true, requestId = null) {
    const monthKey = new Date().toISOString().substring(0, 7); // YYYY-MM
    const usage = {
      PartitionKey: `usage_${monthKey}`,
      RowKey: `${userId}_${Date.now()}_${uuidv4()}`,
      RequestId: requestId, // Correlation ID for Application Insights
      UserId: userId,
      RequestType: requestType,
      Timestamp: new Date().toISOString(),
      TokensUsed: tokensUsed,
      ImageSize: imageSize,
      Success: success
    };

    // Insert usage record
    await new Promise((resolve, reject) => {
      this.tableService.insertEntity('UserUsage', usage, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    // Update user's usage counters
    if (success) {
      await this.incrementUserUsage(userId);
    }
  }

  async incrementUserUsage(userId) {
    const user = await this.getUser(userId);
    if (!user) return null;

    user.TotalUsage = (user.TotalUsage || 0) + 1;
    user.MonthlyUsage = (user.MonthlyUsage || 0) + 1;

    return new Promise((resolve, reject) => {
      const entity = this.convertObjectToEntity(user);
      this.tableService.replaceEntity('Users', entity, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }

  async getUserUsageStats(userId) {
    const user = await this.getUser(userId);
    if (!user) return null;

    const usageLimit = user.UsageLimit || 50;
    
    return {
      totalUsage: user.TotalUsage || 0,
      monthlyUsage: user.MonthlyUsage || 0,
      usageLimit: usageLimit,
      remainingUsage: usageLimit === -1 ? Number.MAX_SAFE_INTEGER : Math.max(0, usageLimit - (user.MonthlyUsage || 0))
    };
  }

  convertEntityToObject(entity) {
    const obj = {};
    for (const key in entity) {
      if (entity[key] && typeof entity[key] === 'object' && entity[key].hasOwnProperty('_')) {
        obj[key] = entity[key]._;
      } else {
        obj[key] = entity[key];
      }
    }
    return obj;
  }

  convertObjectToEntity(obj) {
    const entity = {};
    for (const key in obj) {
      if (key === 'PartitionKey' || key === 'RowKey') {
        entity[key] = obj[key];
      } else {
        entity[key] = { _: obj[key] };
      }
    }
    return entity;
  }
}

module.exports = UserService;
