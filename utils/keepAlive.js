
const http = require('http');
const https = require('https');

class KeepAlive {
  constructor() {
    this.pingInterval = 5000; // 5 seconds
    this.isRunning = false;
    this.intervalId = null;
  }

  // Silent ping without console output
  async silentPing() {
    try {
      // Get current repl URL
      const replUrl = process.env.REPL_SLUG ? 
        `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 
        'http://localhost:3000';

      const url = new URL(replUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: '/',
        method: 'GET',
        timeout: 3000,
        headers: {
          'User-Agent': 'KeepAlive-Bot'
        }
      };

      const lib = url.protocol === 'https:' ? https : http;
      
      return new Promise((resolve) => {
        const req = lib.request(options, (res) => {
          res.on('data', () => {}); // Consume response data
          res.on('end', () => resolve(true));
        });

        req.on('error', () => resolve(false));
        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });

        req.setTimeout(3000);
        req.end();
      });
    } catch (error) {
      return false;
    }
  }

  // Start keep-alive system
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🔄 Keep-alive system started (24/7 mode)');
    
    this.intervalId = setInterval(async () => {
      await this.silentPing();
    }, this.pingInterval);
  }

  // Stop keep-alive system
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('⏹️ Keep-alive system stopped');
  }

  // Get status
  getStatus() {
    return {
      isRunning: this.isRunning,
      pingInterval: this.pingInterval,
      nextPing: this.isRunning ? new Date(Date.now() + this.pingInterval) : null
    };
  }
}

module.exports = new KeepAlive();
