class GlobalErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
    this.rateLimitCache = new Map();
    this.userInfoCache = new Map();
    this.CACHE_DURATION = 300000; // 5 minutes
  }

  logError(error, context = 'Unknown') {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      context,
      error: error.message || error,
      stack: error.stack
    };

    this.errorLog.unshift(errorEntry);

    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Don't log rate limit, timeout, or connection errors to reduce spam
    if (!error.toString().includes('Rate limited') && 
        !error.toString().includes('timeout') && 
        !error.toString().includes('timed out') &&
        !error.toString().includes('HandleEvent timeout') &&
        !error.toString().includes('Reply timeout') &&
        !error.toString().includes('Event timeout') &&
        !error.toString().includes('ECONNRESET') &&
        !error.toString().includes('ETIMEDOUT') &&
        !error.toString().includes('ENOTFOUND') &&
        error.error !== 3252001) {
      console.error(`[${context}] ${error.message || error}`);
    }
  }

  getRecentErrors(limit = 10) {
    return this.errorLog.slice(0, limit);
  }

  // Enhanced rate limited API call wrapper
  async rateLimitedApiCall(apiFunction, retries = 3, baseDelay = 8000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await apiFunction();
      } catch (error) {
        const is429 = error.response?.status === 429 || 
                     error.toString().includes('429') || 
                     error.toString().includes('Rate limited') ||
                     error.toString().includes('temporarily blocked') ||
                     error.error === 3252001 ||
                     error.error === 1545116; // Facebook rate limit errors

        const isNetworkError = error.code === 'ECONNRESET' || 
                              error.code === 'ETIMEDOUT' ||
                              error.code === 'ENOTFOUND';

        if ((is429 || isNetworkError) && attempt < retries) {
          const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 2000;
          console.log(`API issue detected, retrying in ${Math.round(delay)}ms (attempt ${attempt}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        if (is429 || isNetworkError) {
          console.log('Max retries reached for API request, returning fallback response');
          return null;
        }

        throw error;
      }
    }
  }

  // Enhanced Facebook getUserInfo wrapper with caching and rate limiting
  async rateLimitedGetUserInfo(api, userIds) {
    const now = Date.now();
    const idsArray = Array.isArray(userIds) ? userIds : [userIds];
    const cachedResults = {};
    const uncachedIds = [];

    // Check cache first
    for (const id of idsArray) {
      const cached = this.userInfoCache.get(id);
      if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
        cachedResults[id] = cached.data;
      } else {
        uncachedIds.push(id);
      }
    }

    // If all data is cached, return immediately
    if (uncachedIds.length === 0) {
      return cachedResults;
    }

    // Fetch uncached data with rate limiting
    const result = await this.rateLimitedApiCall(async () => {
      return new Promise((resolve, reject) => {
        api.getUserInfo(uncachedIds, (err, data) => {
          if (err) {
            if (err.error === 3252001) {
              // Create fallback data for rate limits
              const fallbackData = {};
              uncachedIds.forEach(id => {
                fallbackData[id] = {
                  name: `User-${id.slice(-6)}`,
                  firstName: "Unknown",
                  vanity: "",
                  thumbSrc: `https://graph.facebook.com/${id}/picture?type=large`,
                  profileUrl: `https://facebook.com/${id}`,
                  gender: 0,
                  type: "user",
                  isFriend: false,
                  isBirthday: false,
                  searchTokens: [],
                  alternateName: ""
                };
              });
              resolve(fallbackData);
            } else {
              reject(err);
            }
          } else {
            resolve(data);
          }
        });
      });
    }, 2, 8000);

    // Cache new results
    if (result) {
      for (const id in result) {
        this.userInfoCache.set(id, {
          data: result[id],
          timestamp: now
        });
      }
    }

    // Return combined cached and new results
    return { ...cachedResults, ...(result || {}) };
  }

  // Clean expired cache entries
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.userInfoCache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.userInfoCache.delete(key);
      }
    }
  }

  // Start periodic cache cleanup
  startCacheCleanup() {
    setInterval(() => {
      this.cleanCache();
    }, 600000); // Clean every 10 minutes
  }
}

process.on('uncaughtException', (error) => {
    // Filter out common Facebook API errors
    const ignoredErrors = [
        'Thread Disabled',
        'ECONNRESET',
        'ETIMEDOUT',
        'socket hang up',
        'Rate limit',
        'spam protection'
    ];

    const shouldIgnore = ignoredErrors.some(err => 
        error.message && error.message.includes(err)
    );

    if (!shouldIgnore) {
        console.error('Uncaught Exception:', error);
    }
    // Don't exit the process for these errors
});

module.exports = new GlobalErrorHandler();