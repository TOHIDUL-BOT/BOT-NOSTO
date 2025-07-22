
const disabledThreads = new Set();
const lastChecked = new Map();

module.exports = {
    isThreadDisabled(threadID) {
        return disabledThreads.has(threadID);
    },
    
    markThreadDisabled(threadID) {
        disabledThreads.add(threadID);
        console.log(`Thread ${threadID} marked as disabled`);
    },
    
    markThreadEnabled(threadID) {
        disabledThreads.delete(threadID);
        console.log(`Thread ${threadID} marked as enabled`);
    },
    
    async checkThreadHealth(api, threadID) {
        const now = Date.now();
        const lastCheck = lastChecked.get(threadID) || 0;
        
        // Only check once per hour
        if (now - lastCheck < 3600000) {
            return !this.isThreadDisabled(threadID);
        }
        
        try {
            await new Promise((resolve, reject) => {
                api.sendMessage("", threadID, (err, info) => {
                    if (err && (err.error === 1545116 || err.threadDisabled)) {
                        this.markThreadDisabled(threadID);
                        reject(new Error('THREAD_DISABLED'));
                    } else if (err) {
                        reject(err);
                    } else {
                        this.markThreadEnabled(threadID);
                        resolve(info);
                    }
                });
            });
            
            lastChecked.set(threadID, now);
            return true;
        } catch (error) {
            lastChecked.set(threadID, now);
            return false;
        }
    },
    
    getDisabledThreads() {
        return Array.from(disabledThreads);
    }
};
