
module.exports = function ({ api, Users, Threads, Currencies, logger }) {
  const PostgreSQL = require('../database/postgresql')();
  
  return async function handleCreateDatabase({ event }) {
    try {
      if (!event || !global.config.autoCreateDB) return;

      const { threadID, senderID, isGroup } = event;

      // Create thread data if needed
      if (isGroup && threadID && !global.data.allThreadID.includes(threadID)) {
        try {
          // Create in JSON first (for compatibility)
          try {
            await Threads.createData(threadID, { reactUnsend: true });
          } catch (error) {
            if (error.message && error.message.includes('Thread Disabled')) {
              logger.log(`Skipping disabled thread: ${threadID}`, 'DATABASE');
              return;
            }
            throw error;
          }
          
          global.data.allThreadID.push(threadID);
          global.data.threadData.set(threadID, {});

          // Get thread info
          let threadInfo = {};
          let threadName = null;
          let memberCount = 0;
          
          try {
            threadInfo = await api.getThreadInfo(threadID);
            if (threadInfo) {
              threadName = threadInfo.threadName || threadInfo.name;
              memberCount = threadInfo.participantIDs ? threadInfo.participantIDs.length : 0;
              global.data.threadInfo.set(threadID, threadInfo);
            }
          } catch (error) {
            logger.log(`Could not get thread info for ${threadID}: ${error.message}`, "DEBUG");
          }

          // Save to PostgreSQL
          if (process.env.DATABASE_URL) {
            await PostgreSQL.createThread(threadID, {
              threadName: threadName,
              approved: false,
              data: {},
              threadInfo: threadInfo,
              memberCount: memberCount
            });
          }
        } catch (error) {
          logger.log(`Thread creation error for ${threadID}: ${error.message}`, "DEBUG");
        }
      }

      // Create user data if needed
      if (senderID && !global.data.allUserID.includes(senderID)) {
        try {
          // Create in JSON first (for compatibility)
          await Users.createData(senderID);
          global.data.allUserID.push(senderID);

          // Get user info
          let userInfo = {};
          let userName = null;
          
          try {
            userInfo = await api.getUserInfo(senderID);
            if (userInfo && userInfo[senderID]) {
              userName = userInfo[senderID].name;
              global.data.userName.set(senderID, userName);
            }
          } catch (error) {
            logger.log(`Could not get user info for ${senderID}: ${error.message}`, "DEBUG");
          }

          // Save to PostgreSQL
          if (process.env.DATABASE_URL && global.PostgreSQL) {
            await global.PostgreSQL.createUser(senderID, {
              name: userName,
              money: 0,
              exp: 0,
              data: {},
              busy: false
            });
          }
        } catch (error) {
          logger.log(`User creation error for ${senderID}: ${error.message}`, "DEBUG");
        }
      }

      // Create currency data if needed
      if (senderID && !global.data.allCurrenciesID.includes(senderID)) {
        try {
          await Currencies.createData(senderID);
          global.data.allCurrenciesID.push(senderID);

          // Save to PostgreSQL
          if (process.env.DATABASE_URL && global.PostgreSQL) {
            await global.PostgreSQL.createCurrency(senderID, {
              money: 0,
              bank: 0,
              data: {}
            });
          }
        } catch (error) {
          logger.log(`Currency creation error for ${senderID}: ${error.message}`, "DEBUG");
        }
      }

    } catch (error) {
      logger.log(`HandleCreateDatabase error: ${error.message}`, "DEBUG");
    }
  };
};
