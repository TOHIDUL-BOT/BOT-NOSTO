
class APIHealthMonitor {
  constructor() {
    this.apiStats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitHits: 0,
      lastErrorTime: null,
      consecutiveErrors: 0
    };
    this.healthCheckInterval = 300000; // 5 minutes
    this.startHealthCheck();
  }

  recordRequest(success, error = null) {
    this.apiStats.totalRequests++;
    
    if (success) {
      this.apiStats.successfulRequests++;
      this.apiStats.consecutiveErrors = 0;
    } else {
      this.apiStats.failedRequests++;
      this.apiStats.lastErrorTime = new Date();
      this.apiStats.consecutiveErrors++;
      
      if (error && (error.error === 3252001 || error.toString().includes('Rate limited'))) {
        this.apiStats.rateLimitHits++;
      }
    }
  }

  getHealthStatus() {
    const successRate = this.apiStats.totalRequests > 0 ? 
      (this.apiStats.successfulRequests / this.apiStats.totalRequests) * 100 : 100;
    
    return {
      status: successRate > 80 ? 'healthy' : successRate > 60 ? 'degraded' : 'unhealthy',
      successRate: Math.round(successRate),
      stats: this.apiStats,
      isRateLimited: this.apiStats.consecutiveErrors >= 3
    };
  }

  startHealthCheck() {
    setInterval(() => {
      const health = this.getHealthStatus();
      if (health.status !== 'healthy') {
        console.log(`🔍 API Health: ${health.status.toUpperCase()} (${health.successRate}% success rate)`);
        
        if (health.isRateLimited) {
          console.log('⚠️ API appears to be rate limited. Implementing extended delays...');
        }
      }
    }, this.healthCheckInterval);
  }

  reset() {
    this.apiStats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitHits: 0,
      lastErrorTime: null,
      consecutiveErrors: 0
    };
  }
}

module.exports = new APIHealthMonitor();
