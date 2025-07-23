
const { Pool } = require('pg');

module.exports = function () {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Initialize tables
    async function initTables() {
        try {
            // Users table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    user_id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(255),
                    money BIGINT DEFAULT 0,
                    exp BIGINT DEFAULT 0,
                    data JSONB DEFAULT '{}',
                    banned BOOLEAN DEFAULT false,
                    ban_reason TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);

            // Threads table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS threads (
                    thread_id VARCHAR(50) PRIMARY KEY,
                    thread_name VARCHAR(255),
                    approved BOOLEAN DEFAULT false,
                    banned BOOLEAN DEFAULT false,
                    data JSONB DEFAULT '{}',
                    thread_info JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);

            // Approved groups table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS approved_groups (
                    thread_id VARCHAR(50) PRIMARY KEY,
                    approved_by VARCHAR(50),
                    approved_at TIMESTAMP DEFAULT NOW(),
                    status VARCHAR(20) DEFAULT 'approved'
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
                INSERT INTO users (user_id, name, money, exp, data)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (user_id) DO UPDATE SET
                    name = EXCLUDED.name,
                    updated_at = NOW()
                RETURNING *
            `;
            const values = [
                userID,
                userData.name || null,
                userData.money || 0,
                userData.exp || 0,
                JSON.stringify(userData.data || {})
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
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    async function updateUser(userID, updates) {
        try {
            const setClause = Object.keys(updates).map((key, index) => 
                `${key} = $${index + 2}`
            ).join(', ');
            
            const query = `
                UPDATE users SET ${setClause}, updated_at = NOW()
                WHERE user_id = $1
                RETURNING *
            `;
            const values = [userID, ...Object.values(updates)];
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error updating user:', error);
            return false;
        }
    }

    // Thread functions
    async function createThread(threadID, threadData = {}) {
        try {
            const query = `
                INSERT INTO threads (thread_id, thread_name, approved, data, thread_info)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (thread_id) DO UPDATE SET
                    thread_name = EXCLUDED.thread_name,
                    updated_at = NOW()
                RETURNING *
            `;
            const values = [
                threadID,
                threadData.threadName || null,
                threadData.approved || false,
                JSON.stringify(threadData.data || {}),
                JSON.stringify(threadData.threadInfo || {})
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
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error getting thread:', error);
            return null;
        }
    }

    async function approveGroup(threadID, approvedBy) {
        try {
            // Update threads table
            await pool.query(
                'UPDATE threads SET approved = true, updated_at = NOW() WHERE thread_id = $1',
                [threadID]
            );
            
            // Add to approved_groups table
            await pool.query(`
                INSERT INTO approved_groups (thread_id, approved_by)
                VALUES ($1, $2)
                ON CONFLICT (thread_id) DO UPDATE SET
                    approved_by = EXCLUDED.approved_by,
                    approved_at = NOW()
            `, [threadID, approvedBy]);
            
            return true;
        } catch (error) {
            console.error('Error approving group:', error);
            return false;
        }
    }

    async function getApprovedGroups() {
        try {
            const result = await pool.query(`
                SELECT thread_id FROM approved_groups 
                WHERE status = 'approved'
            `);
            return result.rows.map(row => row.thread_id);
        } catch (error) {
            console.error('Error getting approved groups:', error);
            return [];
        }
    }

    return {
        pool,
        initTables,
        createUser,
        getUser,
        updateUser,
        createThread,
        getThread,
        approveGroup,
        getApprovedGroups
    };
};
