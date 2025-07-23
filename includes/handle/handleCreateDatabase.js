module.exports = function ({ api, Users, Threads, Currencies, logger }) {
  const PostgreSQL = require('../database/postgresql')();
  
  return async function handleCreateDatabase({ event }) {
    try {
      if (!event || !global.config.autoCreateDB) return;

      const { threadID, senderID, isGroup } = event;

      // Create thread data if needed
      if (isGroup && threadID && !global.data.allThreadID.includes(threadID)) {
        try {
          try {
            await Threads.createData(threadID, { reactUnsend: true });
          } catch (error) {
            if (error.message && error.message.includes('Thread Disabled')) {
              // Skip disabled threads
              logger.log(`Skipping disabled thread: ${threadID}`, 'DATABASE');
              return;
            }
            throw error;
          }
          global.data.allThreadID.push(threadID);
          global.data.threadData.set(threadID, {});

          // Get thread info
          const threadInfo = await api.getThreadInfo(threadID);
          if (threadInfo) {
            global.data.threadInfo.set(threadID, threadInfo);
          }
        } catch (error) {
          logger.log(`Thread creation error for ${threadID}: ${error.message}`, "DEBUG");
        }
      }

      // Create user data if needed
      if (senderID && !global.data.allUserID.includes(senderID)) {
        try {
          // Create in JSON (for backward compatibility)
          await Users.createData(senderID);
          global.data.allUserID.push(senderID);

          // Get user info
          const userInfo = await api.getUserInfo(senderID);
          let userName = null;
          if (userInfo && userInfo[senderID]) {
            userName = userInfo[senderID].name;
            global.data.userName.set(senderID, userName);
          }

          // Save to PostgreSQL for persistence
          if (process.env.DATABASE_URL) {
            await PostgreSQL.createUser(senderID, {
              name: userName,
              money: 0,
              exp: 0,
              data: {}
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
        } catch (error) {
          logger.log(`Currency creation error for ${senderID}: ${error.message}`, "DEBUG");
        }
      }

    } catch (error) {
      logger.log(`HandleCreateDatabase error: ${error.message}`, "DEBUG");
    }
  };
};