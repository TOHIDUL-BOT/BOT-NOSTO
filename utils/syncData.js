
const fs = require('fs').promises;
const path = require('path');

class DataSync {
  constructor() {
    this.PostgreSQL = require('../includes/database/postgresql')();
  }

  // Sync all data from PostgreSQL to local files and global cache
  async syncFromPostgreSQL() {
    try {
      if (!process.env.DATABASE_URL) {
        console.log('⚠️ No DATABASE_URL found. Skipping PostgreSQL sync.');
        return false;
      }

      console.log('🔄 Starting data sync from PostgreSQL...');

      // Get all data from PostgreSQL
      const [users, threads, currencies, approvedGroups] = await Promise.all([
        this.PostgreSQL.getAllUsers(),
        this.PostgreSQL.getAllThreads(),
        this.PostgreSQL.pool.query('SELECT * FROM currencies'),
        this.PostgreSQL.getApprovedGroups()
      ]);

      // Sync users data
      const usersData = {};
      users.forEach(user => {
        usersData[user.user_id] = {
          name: user.name,
          data: user.data || {},
          banned: user.banned,
          ban_reason: user.ban_reason
        };
        
        // Update global cache
        if (!global.data.allUserID.includes(user.user_id)) {
          global.data.allUserID.push(user.user_id);
        }
        if (user.name) {
          global.data.userName.set(user.user_id, user.name);
        }
      });

      // Sync threads data
      const threadsData = {};
      threads.forEach(thread => {
        threadsData[thread.thread_id] = {
          threadName: thread.thread_name,
          data: thread.data || {},
          threadInfo: thread.thread_info || {},
          banned: thread.banned,
          approved: thread.approved
        };

        // Update global cache
        if (!global.data.allThreadID.includes(thread.thread_id)) {
          global.data.allThreadID.push(thread.thread_id);
        }
        global.data.threadData.set(thread.thread_id, thread.data || {});
        global.data.threadInfo.set(thread.thread_id, thread.thread_info || {});
      });

      // Write to local files
      await fs.writeFile(
        path.join(__dirname, '../includes/database/data/usersData.json'),
        JSON.stringify(usersData, null, 2)
      );

      await fs.writeFile(
        path.join(__dirname, '../includes/database/data/threadsData.json'),
        JSON.stringify(threadsData, null, 2)
      );

      // Update config.json with approved groups
      if (approvedGroups.length > 0) {
        const configPath = path.join(__dirname, '../config.json');
        try {
          const configData = await fs.readFile(configPath, 'utf8');
          const config = JSON.parse(configData);
          
          config.APPROVAL = config.APPROVAL || {};
          config.APPROVAL.approvedGroups = approvedGroups.map(g => g.thread_id);
          
          await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        } catch (error) {
          console.log(`Could not update config.json: ${error.message}`);
        }
      }

      console.log(`✅ Data sync completed: ${users.length} users, ${threads.length} threads, ${approvedGroups.length} approved groups`);
      return true;
    } catch (error) {
      console.error('❌ Data sync error:', error);
      return false;
    }
  }

  // Backup current data to PostgreSQL
  async backupToPostgreSQL() {
    try {
      if (!process.env.DATABASE_URL) {
        console.log('⚠️ No DATABASE_URL found. Skipping backup.');
        return false;
      }

      console.log('🔄 Starting backup to PostgreSQL...');

      // Read local data files
      const usersPath = path.join(__dirname, '../includes/database/data/usersData.json');
      const threadsPath = path.join(__dirname, '../includes/database/data/threadsData.json');
      const configPath = path.join(__dirname, '../config.json');

      let usersData = {};
      let threadsData = {};
      let config = {};

      try {
        usersData = JSON.parse(await fs.readFile(usersPath, 'utf8'));
      } catch (e) { console.log('No users data file found'); }

      try {
        threadsData = JSON.parse(await fs.readFile(threadsPath, 'utf8'));
      } catch (e) { console.log('No threads data file found'); }

      try {
        config = JSON.parse(await fs.readFile(configPath, 'utf8'));
      } catch (e) { console.log('No config file found'); }

      // Backup users
      for (const [userID, userData] of Object.entries(usersData)) {
        await this.PostgreSQL.createUser(userID, userData);
      }

      // Backup threads
      for (const [threadID, threadData] of Object.entries(threadsData)) {
        await this.PostgreSQL.createThread(threadID, threadData);
      }

      // Backup approved groups
      if (config.APPROVAL && config.APPROVAL.approvedGroups) {
        for (const threadID of config.APPROVAL.approvedGroups) {
          const threadData = threadsData[threadID];
          await this.PostgreSQL.approveGroup(
            threadID,
            threadData?.threadName || 'Unknown',
            'system',
            0
          );
        }
      }

      console.log('✅ Backup to PostgreSQL completed');
      return true;
    } catch (error) {
      console.error('❌ Backup error:', error);
      return false;
    }
  }

  // Auto sync on startup
  async autoSync() {
    if (process.env.DATABASE_URL) {
      await this.syncFromPostgreSQL();
    }
  }
}

module.exports = new DataSync();
