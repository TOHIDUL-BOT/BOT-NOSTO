
const { Pool } = require('pg');

module.exports = function () {
    // Get DATABASE_URL from config.json or environment variable
    const config = require('../../config.json');
    const databaseUrl = config.DATABASE?.DATABASE_URL || process.env.DATABASE_URL;
    
    if (!databaseUrl) {
        console.log('⚠️ No DATABASE_URL found in config.json or environment variables');
        return null;
    }

    const pool = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Initialize all tables
    async function initTables() {
        try {
            // Users table with complete data
            await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    user_id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(255),
                    money BIGINT DEFAULT 0,
                    exp BIGINT DEFAULT 0,
                    data JSONB DEFAULT '{}',
                    banned BOOLEAN DEFAULT false,
                    ban_reason TEXT,
                    busy JSONB DEFAULT 'false',
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);

            // Threads table with complete data
            await pool.query(`
                CREATE TABLE IF NOT EXISTS threads (
                    thread_id VARCHAR(50) PRIMARY KEY,
                    thread_name VARCHAR(255),
                    approved BOOLEAN DEFAULT false,
                    banned BOOLEAN DEFAULT false,
                    data JSONB DEFAULT '{}',
                    thread_info JSONB DEFAULT '{}',
                    member_count INTEGER DEFAULT 0,
                    nsfw BOOLEAN DEFAULT false,
                    command_banned JSONB DEFAULT '[]',
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);

            // Currencies table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS currencies (
                    user_id VARCHAR(50) PRIMARY KEY,
                    money BIGINT DEFAULT 0,
                    bank BIGINT DEFAULT 0,
                    data JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);

            // Approved groups table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS approved_groups (
                    thread_id VARCHAR(50) PRIMARY KEY,
                    thread_name VARCHAR(255),
                    approved_by VARCHAR(50),
                    approved_at TIMESTAMP DEFAULT NOW(),
                    status VARCHAR(20) DEFAULT 'approved',
                    member_count INTEGER DEFAULT 0
                )
            `);

            // Bot settings and data
            await pool.query(`
                CREATE TABLE IF NOT EXISTS bot_settings (
                    key VARCHAR(100) PRIMARY KEY,
                    value JSONB,
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);

            console.log('✅ Database tables initialized successfully');
        } catch (error) {
            console.error('❌ Database initialization error:', error);
        }
    }

    // User functions
    async function createUser(userID, userData = {}) {
        try {
            const query = `
                INSERT INTO users (user_id, name, money, exp, data, busy)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (user_id) DO UPDATE SET
                    name = COALESCE(EXCLUDED.name, users.name),
                    updated_at = NOW()
                RETURNING *
            `;
            const values = [
                userID,
                userData.name || null,
                userData.money || 0,
                userData.exp || 0,
                JSON.stringify(userData.data || {}),
                JSON.stringify(userData.busy || false)
            ];
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating user:', error);
            return false;
        }
    }

    async function getUser(userID) {
        try {
            const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [userID]);
            if (result.rows[0]) {
                const user = result.rows[0];
                // Parse JSON fields
                user.data = typeof user.data === 'string' ? JSON.parse(user.data) : user.data;
                user.busy = typeof user.busy === 'string' ? JSON.parse(user.busy) : user.busy;
                return user;
            }
            return null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    async function updateUser(userID, updates) {
        try {
            const setFields = [];
            const values = [userID];
            let valueIndex = 2;

            Object.keys(updates).forEach(key => {
                if (key === 'data' || key === 'busy') {
                    setFields.push(`${key} = $${valueIndex}`);
                    values.push(JSON.stringify(updates[key]));
                } else {
                    setFields.push(`${key} = $${valueIndex}`);
                    values.push(updates[key]);
                }
                valueIndex++;
            });

            const query = `
                UPDATE users SET ${setFields.join(', ')}, updated_at = NOW()
                WHERE user_id = $1
                RETURNING *
            `;
            
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error updating user:', error);
            return false;
        }
    }

    async function getAllUsers() {
        try {
            const result = await pool.query('SELECT * FROM users');
            return result.rows.map(user => {
                user.data = typeof user.data === 'string' ? JSON.parse(user.data) : user.data;
                user.busy = typeof user.busy === 'string' ? JSON.parse(user.busy) : user.busy;
                return user;
            });
        } catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    }

    // Thread functions
    async function createThread(threadID, threadData = {}) {
        try {
            const query = `
                INSERT INTO threads (thread_id, thread_name, approved, data, thread_info, member_count, nsfw, command_banned)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (thread_id) DO UPDATE SET
                    thread_name = COALESCE(EXCLUDED.thread_name, threads.thread_name),
                    member_count = COALESCE(EXCLUDED.member_count, threads.member_count),
                    updated_at = NOW()
                RETURNING *
            `;
            const values = [
                threadID,
                threadData.threadName || null,
                threadData.approved || false,
                JSON.stringify(threadData.data || {}),
                JSON.stringify(threadData.threadInfo || {}),
                threadData.memberCount || 0,
                threadData.nsfw || false,
                JSON.stringify(threadData.commandBanned || [])
            ];
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating thread:', error);
            return false;
        }
    }

    async function getThread(threadID) {
        try {
            const result = await pool.query('SELECT * FROM threads WHERE thread_id = $1', [threadID]);
            if (result.rows[0]) {
                const thread = result.rows[0];
                thread.data = typeof thread.data === 'string' ? JSON.parse(thread.data) : thread.data;
                thread.thread_info = typeof thread.thread_info === 'string' ? JSON.parse(thread.thread_info) : thread.thread_info;
                thread.command_banned = typeof thread.command_banned === 'string' ? JSON.parse(thread.command_banned) : thread.command_banned;
                return thread;
            }
            return null;
        } catch (error) {
            console.error('Error getting thread:', error);
            return null;
        }
    }

    async function getAllThreads() {
        try {
            const result = await pool.query('SELECT * FROM threads');
            return result.rows.map(thread => {
                thread.data = typeof thread.data === 'string' ? JSON.parse(thread.data) : thread.data;
                thread.thread_info = typeof thread.thread_info === 'string' ? JSON.parse(thread.thread_info) : thread.thread_info;
                thread.command_banned = typeof thread.command_banned === 'string' ? JSON.parse(thread.command_banned) : thread.command_banned;
                return thread;
            });
        } catch (error) {
            console.error('Error getting all threads:', error);
            return [];
        }
    }

    // Currency functions
    async function createCurrency(userID, currencyData = {}) {
        try {
            const query = `
                INSERT INTO currencies (user_id, money, bank, data)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id) DO UPDATE SET
                    updated_at = NOW()
                RETURNING *
            `;
            const values = [
                userID,
                currencyData.money || 0,
                currencyData.bank || 0,
                JSON.stringify(currencyData.data || {})
            ];
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating currency:', error);
            return false;
        }
    }

    async function getCurrency(userID) {
        try {
            const result = await pool.query('SELECT * FROM currencies WHERE user_id = $1', [userID]);
            if (result.rows[0]) {
                const currency = result.rows[0];
                currency.data = typeof currency.data === 'string' ? JSON.parse(currency.data) : currency.data;
                return currency;
            }
            return null;
        } catch (error) {
            console.error('Error getting currency:', error);
            return null;
        }
    }

    async function updateCurrency(userID, updates) {
        try {
            // First ensure currency record exists
            const existing = await getCurrency(userID);
            if (!existing) {
                await createCurrency(userID, updates);
                return await getCurrency(userID);
            }

            const setFields = [];
            const values = [userID];
            let valueIndex = 2;

            Object.keys(updates).forEach(key => {
                if (key === 'data') {
                    setFields.push(`${key} = $${valueIndex}`);
                    values.push(JSON.stringify(updates[key]));
                } else {
                    setFields.push(`${key} = $${valueIndex}`);
                    values.push(updates[key]);
                }
                valueIndex++;
            });

            const query = `
                UPDATE currencies SET ${setFields.join(', ')}, updated_at = NOW()
                WHERE user_id = $1
                RETURNING *
            `;
            
            const result = await pool.query(query, values);
            if (result.rows[0]) {
                const currency = result.rows[0];
                currency.data = typeof currency.data === 'string' ? JSON.parse(currency.data) : currency.data;
                return currency;
            }
            return false;
        } catch (error) {
            console.error('Error updating currency:', error);
            return false;
        }
    }

    // Approval functions
    async function approveGroup(threadID, threadName, approvedBy, memberCount = 0) {
        try {
            // First ensure thread exists in threads table
            await pool.query(`
                INSERT INTO threads (thread_id, thread_name, approved, member_count, data)
                VALUES ($1, $2, true, $3, '{}')
                ON CONFLICT (thread_id) DO UPDATE SET
                    approved = true,
                    thread_name = COALESCE(EXCLUDED.thread_name, threads.thread_name),
                    member_count = COALESCE(EXCLUDED.member_count, threads.member_count),
                    updated_at = NOW()
            `, [threadID, threadName, memberCount]);
            
            // Add to approved_groups table
            await pool.query(`
                INSERT INTO approved_groups (thread_id, thread_name, approved_by, member_count)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (thread_id) DO UPDATE SET
                    approved_by = EXCLUDED.approved_by,
                    approved_at = NOW(),
                    member_count = EXCLUDED.member_count
            `, [threadID, threadName, approvedBy, memberCount]);
            
            return true;
        } catch (error) {
            console.error('Error approving group:', error);
            return false;
        }
    }

    async function isGroupApproved(threadID) {
        try {
            const result = await pool.query(
                'SELECT approved FROM threads WHERE thread_id = $1',
                [threadID]
            );
            return result.rows.length > 0 ? result.rows[0].approved : false;
        } catch (error) {
            console.error('Error checking group approval:', error);
            return false;
        }
    }

    async function addToPendingApproval(threadID, threadName, memberCount = 0) {
        try {
            await pool.query(`
                INSERT INTO threads (thread_id, thread_name, approved, member_count, data)
                VALUES ($1, $2, false, $3, '{"status": "pending"}')
                ON CONFLICT (thread_id) DO UPDATE SET
                    thread_name = EXCLUDED.thread_name,
                    member_count = EXCLUDED.member_count,
                    data = jsonb_set(COALESCE(threads.data, '{}'), '{status}', '"pending"'),
                    updated_at = NOW()
            `, [threadID, threadName, memberCount]);
            
            return true;
        } catch (error) {
            console.error('Error adding to pending approval:', error);
            return false;
        }
    }

    async function syncApprovalToConfig() {
        try {
            const approvedGroups = await pool.query(
                'SELECT thread_id FROM threads WHERE approved = true ORDER BY updated_at DESC'
            );
            
            const pendingGroups = await pool.query(
                'SELECT thread_id FROM threads WHERE approved = false AND data->>\'status\' = \'pending\' ORDER BY updated_at DESC'
            );

            const fs = require('fs');
            const path = require('path');
            const configPath = path.join(__dirname, '../../config.json');
            
            let config = {};
            try {
                const configData = fs.readFileSync(configPath, 'utf8');
                config = JSON.parse(configData);
            } catch (error) {
                console.error('Error reading config:', error);
                return false;
            }

            // Initialize APPROVAL if not exists
            if (!config.APPROVAL) {
                config.APPROVAL = { approvedGroups: [], pendingGroups: [], rejectedGroups: [] };
            }

            // Update approved groups
            config.APPROVAL.approvedGroups = approvedGroups.rows.map(row => row.thread_id);
            config.APPROVAL.pendingGroups = pendingGroups.rows.map(row => row.thread_id);

            // Also update AUTO_APPROVE for compatibility
            if (!config.AUTO_APPROVE) {
                config.AUTO_APPROVE = { enabled: true, approvedGroups: [] };
            }
            config.AUTO_APPROVE.approvedGroups = config.APPROVAL.approvedGroups;

            // Save config
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log('✅ Config.json synced with database approval data');
            
            return true;
        } catch (error) {
            console.error('Error syncing approval to config:', error);
            return false;
        }
    }

    async function getApprovedGroups() {
        try {
            const result = await pool.query(`
                SELECT * FROM approved_groups 
                WHERE status = 'approved'
                ORDER BY approved_at DESC
            `);
            return result.rows;
        } catch (error) {
            console.error('Error getting approved groups:', error);
            return [];
        }
    }

    async function removeApprovedGroup(threadID) {
        try {
            await pool.query('UPDATE threads SET approved = false WHERE thread_id = $1', [threadID]);
            await pool.query('DELETE FROM approved_groups WHERE thread_id = $1', [threadID]);
            return true;
        } catch (error) {
            console.error('Error removing approved group:', error);
            return false;
        }
    }

    // Bot settings functions
    async function setBotSetting(key, value) {
        try {
            await pool.query(`
                INSERT INTO bot_settings (key, value)
                VALUES ($1, $2)
                ON CONFLICT (key) DO UPDATE SET
                    value = EXCLUDED.value,
                    updated_at = NOW()
            `, [key, JSON.stringify(value)]);
            return true;
        } catch (error) {
            console.error('Error setting bot setting:', error);
            return false;
        }
    }

    async function getBotSetting(key) {
        try {
            const result = await pool.query('SELECT value FROM bot_settings WHERE key = $1', [key]);
            if (result.rows[0]) {
                const value = result.rows[0].value;
                
                // If it's already an object, return it directly
                if (typeof value === 'object' && value !== null) {
                    return value;
                }
                
                // If it's a string, try to parse it
                if (typeof value === 'string') {
                    try {
                        return JSON.parse(value);
                    } catch (parseError) {
                        console.error('JSON parse error for key:', key, 'value:', value);
                        return value; // Return as string if can't parse
                    }
                }
                
                return value;
            }
            return null;
        } catch (error) {
            console.error('Error getting bot setting:', error);
            return null;
        }
    }

    // Backup and restore functions
    async function backupAllData() {
        try {
            const users = await getAllUsers();
            const threads = await getAllThreads();
            const currencies = await pool.query('SELECT * FROM currencies');
            const approvedGroups = await getApprovedGroups();
            
            return {
                users,
                threads,
                currencies: currencies.rows,
                approvedGroups,
                backupDate: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error backing up data:', error);
            return null;
        }
    }

    return {
        pool,
        initTables,
        // User functions
        createUser,
        getUser,
        updateUser,
        getAllUsers,
        // Thread functions
        createThread,
        getThread,
        getAllThreads,
        // Currency functions
        createCurrency,
        getCurrency,
        updateCurrency,
        // Approval functions
        approveGroup,
        getApprovedGroups,
        removeApprovedGroup,
        isGroupApproved,
        addToPendingApproval,
        syncApprovalToConfig,
        // Bot settings
        setBotSetting,
        getBotSetting,
        // Backup
        backupAllData
    };
};
