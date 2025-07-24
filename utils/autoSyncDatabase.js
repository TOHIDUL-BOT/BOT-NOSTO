
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
        } catch (error) {
            console.log('❌ PostgreSQL connection failed:', error.message);
        }
    }

    // Start auto sync every 30 minutes
    startAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        // Sync immediately on start
        this.syncToPostgreSQL();

        // Then sync every 30 minutes (30 * 60 * 1000 = 1800000 ms)
        this.syncInterval = setInterval(() => {
            this.syncToPostgreSQL();
        }, 30 * 60 * 1000);

        this.isRunning = true;
        console.log('🔄 Auto-sync started: Data will be synced to PostgreSQL every 30 minutes');
    }

    // Stop auto sync
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        this.isRunning = false;
        console.log('⏹️ Auto-sync stopped');
    }

    // Sync all local JSON files to PostgreSQL
    async syncToPostgreSQL() {
        if (!this.PostgreSQL) {
            console.log('⚠️ PostgreSQL not available for sync');
            return false;
        }

        try {
            console.log('🔄 Starting auto-sync to PostgreSQL...');

            // Define file paths
            const usersPath = path.join(__dirname, '../includes/database/data/usersData.json');
            const threadsPath = path.join(__dirname, '../includes/database/data/threadsData.json');
            const bankPath = path.join(__dirname, '../includes/database/data/bankData.json');
            const fbDtsgPath = path.join(__dirname, '../includes/database/data/fb_dtsg.json');

            let syncCount = 0;

            // Sync usersData.json
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
                    syncCount++;
                }
                console.log(`✅ Synced ${Object.keys(usersData).length} users to PostgreSQL`);
            } catch (error) {
                console.log('⚠️ Users data sync error:', error.message);
            }

            // Sync threadsData.json
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
                console.log(`✅ Synced ${Object.keys(threadsData).length} threads to PostgreSQL`);
            } catch (error) {
                console.log('⚠️ Threads data sync error:', error.message);
            }

            // Sync bankData.json (currencies)
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
                console.log(`✅ Synced ${Object.keys(bankData).length} currency records to PostgreSQL`);
            } catch (error) {
                console.log('⚠️ Bank data sync error:', error.message);
            }

            // Sync fb_dtsg.json as bot setting
            try {
                const fbDtsgRaw = await fs.readFile(fbDtsgPath, 'utf8');
                const fbDtsgData = JSON.parse(fbDtsgRaw);
                
                await this.PostgreSQL.setBotSetting('fb_dtsg', fbDtsgData);
                console.log('✅ Synced fb_dtsg data to PostgreSQL');
            } catch (error) {
                console.log('⚠️ fb_dtsg sync error:', error.message);
            }

            const timestamp = new Date().toLocaleString('bn-BD');
            console.log(`🎉 Auto-sync completed successfully at ${timestamp}`);
            return true;

        } catch (error) {
            console.error('❌ Auto-sync error:', error);
            return false;
        }
    }

    // Restore all data from PostgreSQL to local JSON files
    async syncFromPostgreSQL() {
        if (!this.PostgreSQL) {
            console.log('⚠️ PostgreSQL not available for restore');
            return false;
        }

        try {
            console.log('🔄 Restoring data from PostgreSQL...');

            // Define file paths
            const usersPath = path.join(__dirname, '../includes/database/data/usersData.json');
            const threadsPath = path.join(__dirname, '../includes/database/data/threadsData.json');
            const bankPath = path.join(__dirname, '../includes/database/data/bankData.json');
            const fbDtsgPath = path.join(__dirname, '../includes/database/data/fb_dtsg.json');

            // Restore users data
            try {
                const users = await this.PostgreSQL.getAllUsers();
                const usersData = {};
                
                users.forEach(user => {
                    usersData[user.user_id] = {
                        userID: user.user_id,
                        name: user.name,
                        money: user.money || 0,
                        exp: user.exp || 0,
                        createTime: user.created_at ? { timestamp: new Date(user.created_at).getTime() } : { timestamp: Date.now() },
                        data: user.data || { timestamp: Date.now() },
                        lastUpdate: user.updated_at ? new Date(user.updated_at).getTime() : Date.now(),
                        busy: user.busy || false
                    };
                });

                await fs.writeFile(usersPath, JSON.stringify(usersData, null, 2));
                console.log(`✅ Restored ${users.length} users from PostgreSQL`);
            } catch (error) {
                console.log('⚠️ Users restore error:', error.message);
            }

            // Restore threads data
            try {
                const threads = await this.PostgreSQL.getAllThreads();
                const threadsData = {};
                
                threads.forEach(thread => {
                    threadsData[thread.thread_id] = {
                        threadInfo: {
                            threadID: thread.thread_id,
                            threadName: thread.thread_name,
                            ...thread.thread_info
                        },
                        approved: thread.approved,
                        createTime: thread.created_at ? { timestamp: new Date(thread.created_at).getTime() } : { timestamp: Date.now() },
                        data: thread.data || { timestamp: Date.now() }
                    };
                });

                await fs.writeFile(threadsPath, JSON.stringify(threadsData, null, 2));
                console.log(`✅ Restored ${threads.length} threads from PostgreSQL`);
            } catch (error) {
                console.log('⚠️ Threads restore error:', error.message);
            }

            // Restore currencies data
            try {
                const currencies = await this.PostgreSQL.pool.query('SELECT * FROM currencies');
                const bankData = {};
                
                currencies.rows.forEach(currency => {
                    bankData[currency.user_id] = {
                        userID: currency.user_id,
                        money: currency.money || 0,
                        bank: currency.bank || 0,
                        data: currency.data || {},
                        createTime: currency.created_at ? { timestamp: new Date(currency.created_at).getTime() } : { timestamp: Date.now() },
                        lastUpdate: currency.updated_at ? new Date(currency.updated_at).getTime() : Date.now()
                    };
                });

                await fs.writeFile(bankPath, JSON.stringify(bankData, null, 2));
                console.log(`✅ Restored ${currencies.rows.length} currency records from PostgreSQL`);
            } catch (error) {
                console.log('⚠️ Currency restore error:', error.message);
            }

            // Restore fb_dtsg data
            try {
                const fbDtsgData = await this.PostgreSQL.getBotSetting('fb_dtsg');
                if (fbDtsgData) {
                    await fs.writeFile(fbDtsgPath, JSON.stringify(fbDtsgData, null, 2));
                    console.log('✅ Restored fb_dtsg data from PostgreSQL');
                }
            } catch (error) {
                console.log('⚠️ fb_dtsg restore error:', error.message);
            }

            const timestamp = new Date().toLocaleString('bn-BD');
            console.log(`🎉 Data restore completed successfully at ${timestamp}`);
            return true;

        } catch (error) {
            console.error('❌ Data restore error:', error);
            return false;
        }
    }

    // Get sync status
    getStatus() {
        return {
            isRunning: this.isRunning,
            postgresAvailable: !!this.PostgreSQL,
            nextSyncIn: this.isRunning ? '30 minutes' : 'Not scheduled'
        };
    }
}

module.exports = new AutoSyncDatabase();
