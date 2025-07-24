const fs = require('fs').promises;
const path = require('path');

class AutoSyncDatabase {
    constructor() {
        this.syncInterval = null;
        this.isRunning = false;
        this.PostgreSQL = null;

        // Initialize PostgreSQL connection
        try {
            this.PostgreSQL = require('../includes/database/postgresql')();
            // Auto-start save immediately
            this.startAutoSave();
        } catch (error) {
            console.log('❌ PostgreSQL connection failed:', error.message);
        }
    }

    // Start auto save every 2 minutes (always running)
    startAutoSave() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        // Save immediately on start
        this.saveToPostgreSQL();

        // Start saving every 2 minutes (2 * 60 * 1000 = 120000 ms)
        this.syncInterval = setInterval(() => {
            this.saveToPostgreSQL();
        }, 2 * 60 * 1000);

        this.isRunning = true;
        console.log('💾 Auto-save started permanently: Data will be saved to PostgreSQL every 2 minutes');
    }

    // Save all local JSON files to PostgreSQL (backup only)
    async saveToPostgreSQL() {
        if (!this.PostgreSQL) {
            return false;
        }

        try {
            console.log('💾 Auto-saving to PostgreSQL...');

            // Define file paths
            const usersPath = path.join(__dirname, '../includes/database/data/usersData.json');
            const threadsPath = path.join(__dirname, '../includes/database/data/threadsData.json');
            const bankPath = path.join(__dirname, '../includes/database/data/bankData.json');
            const fbDtsgPath = path.join(__dirname, '../includes/database/data/fb_dtsg.json');

            // Save usersData.json
            try {
                const usersRaw = await fs.readFile(usersPath, 'utf8');
                const usersData = JSON.parse(usersRaw);

                for (const [userID, userData] of Object.entries(usersData)) {
                    await this.PostgreSQL.createUser(userID, {
                        name: userData.name,
                        money: userData.money || 0,
                        exp: userData.exp || 0,
                        data: userData.data || {},
                        busy: userData.busy || false
                    });
                }
                console.log(`💾 Saved ${Object.keys(usersData).length} users`);
            } catch (error) {
                console.log('⚠️ Users save error:', error.message);
            }

            // Save threadsData.json
            try {
                const threadsRaw = await fs.readFile(threadsPath, 'utf8');
                const threadsData = JSON.parse(threadsRaw);

                for (const [threadID, threadData] of Object.entries(threadsData)) {
                    await this.PostgreSQL.createThread(threadID, {
                        threadName: threadData.threadInfo?.threadName,
                        approved: threadData.approved || false,
                        data: threadData.data || {},
                        thread_info: threadData.threadInfo || {},
                        member_count: threadData.threadInfo?.participantIDs?.length || 0
                    });
                }
                console.log(`💾 Saved ${Object.keys(threadsData).length} threads`);
            } catch (error) {
                console.log('⚠️ Threads save error:', error.message);
            }

            // Save bankData.json (currencies)
            try {
                const bankRaw = await fs.readFile(bankPath, 'utf8');
                const bankData = JSON.parse(bankRaw);

                for (const [userID, currencyData] of Object.entries(bankData)) {
                    await this.PostgreSQL.createCurrency(userID, {
                        money: currencyData.money || 0,
                        bank: currencyData.bank || 0,
                        data: currencyData.data || {}
                    });
                }
                console.log(`💾 Saved ${Object.keys(bankData).length} currencies`);
            } catch (error) {
                console.log('⚠️ Bank save error:', error.message);
            }

            // Save fb_dtsg.json as bot setting
            try {
                const fbDtsgRaw = await fs.readFile(fbDtsgPath, 'utf8');
                const fbDtsgData = JSON.parse(fbDtsgRaw);

                await this.PostgreSQL.setBotSetting('fb_dtsg', fbDtsgData);
                console.log('💾 Saved fb_dtsg data');
            } catch (error) {
                console.log('⚠️ fb_dtsg save error:', error.message);
            }

            const timestamp = new Date().toLocaleString('bn-BD');
            console.log(`💾 Auto-save completed at ${timestamp}`);
            return true;

        } catch (error) {
            console.error('❌ Auto-save error:', error);
            return false;
        }
    }

    // Restore data from PostgreSQL to local files (for startup sync)
    async syncFromPostgreSQL() {
        if (!this.PostgreSQL) {
            console.log('⚠️ PostgreSQL not available for sync');
            return false;
        }

        try {
            console.log('🔄 Restoring data from PostgreSQL...');

            // Get all data from PostgreSQL
            const [users, threads, approvedGroups] = await Promise.all([
                this.PostgreSQL.getAllUsers(),
                this.PostgreSQL.getAllThreads(),
                this.PostgreSQL.getApprovedGroups()
            ]);

            // Populate global data from PostgreSQL
            users.forEach(user => {
                if (!global.data.allUserID.includes(user.user_id)) {
                    global.data.allUserID.push(user.user_id);
                }
                if (user.name) {
                    global.data.userName.set(user.user_id, user.name);
                }
                if (user.banned) {
                    global.data.userBanned.set(user.user_id, {
                        reason: user.ban_reason || "",
                        dateAdded: user.created_at || ""
                    });
                }
            });

            threads.forEach(thread => {
                if (!global.data.allThreadID.includes(thread.thread_id)) {
                    global.data.allThreadID.push(thread.thread_id);
                }
                global.data.threadData.set(thread.thread_id, thread.data || {});
                global.data.threadInfo.set(thread.thread_id, thread.thread_info || {});

                if (thread.banned) {
                    global.data.threadBanned.set(thread.thread_id, {
                        reason: thread.ban_reason || "",
                        dateAdded: thread.created_at || ""
                    });
                }
                if (thread.nsfw) {
                    global.data.threadAllowNSFW.push(thread.thread_id);
                }
                if (thread.command_banned && thread.command_banned.length > 0) {
                    global.data.commandBanned.set(thread.thread_id, thread.command_banned);
                }
            });

            console.log(`✅ Data restored from PostgreSQL: ${users.length} users, ${threads.length} threads, ${approvedGroups.length} approved groups`);
            return true;

        } catch (error) {
            console.error('❌ Sync from PostgreSQL error:', error);
            return false;
        }
    }

    // Get save status
    getStatus() {
        return {
            isRunning: this.isRunning,
            postgresAvailable: !!this.PostgreSQL,
            nextSaveIn: '2 minutes',
            mode: 'Always Running Auto-Save'
        };
    }
}

module.exports = new AutoSyncDatabase();