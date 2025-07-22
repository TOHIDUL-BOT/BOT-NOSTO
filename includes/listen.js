
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const logger = require("../utils/log.js");

module.exports = function ({ api }) {
  const Users = require("./database/users")({ api });
  const Threads = require("./database/threads")({ api });
  const Currencies = require("./database/currencies")({ api, Users });

  // Enhanced rate limiting and safety
  const messageQueue = new Map();
  const commandCooldowns = new Map();
  const userLastActivity = new Map();

  // Load bot settings
  let botSettings = {};
  try {
    botSettings = require("../config/botSettings.json");
  } catch (e) {
    botSettings = {
      SAFETY_MODE: true,
      RATE_LIMITING: { ENABLED: true, MIN_MESSAGE_INTERVAL: 2000 },
      ERROR_HANDLING: { SILENT_FAILURES: true }
    };
  }

  // Initialize database data silently
  (async function initializeData() {
    try {
      const [threads, users] = await Promise.all([
        Threads.getAll().catch(() => []),
        Users.getAll(["userID", "name", "data"]).catch(() => [])
      ]);

      // Process threads data
      threads.forEach((data) => {
        const idThread = String(data.threadID);
        global.data.allThreadID.push(idThread);
        global.data.threadData.set(idThread, data.data || {});
        global.data.threadInfo.set(idThread, data.threadInfo || {});

        if (data.data?.banned) {
          global.data.threadBanned.set(idThread, {
            reason: data.data.reason || "",
            dateAdded: data.data.dateAdded || ""
          });
        }

        if (data.data?.commandBanned?.length) {
          global.data.commandBanned.set(idThread, data.data.commandBanned);
        }

        if (data.data?.NSFW) {
          global.data.threadAllowNSFW.push(idThread);
        }
      });

      // Process users data
      users.forEach((dataU) => {
        const idUsers = String(dataU.userID);
        global.data.allUserID.push(idUsers);

        if (dataU.name?.length) {
          global.data.userName.set(idUsers, dataU.name);
        }

        if (dataU.data?.banned) {
          global.data.userBanned.set(idUsers, {
            reason: dataU.data.reason || "",
            dateAdded: dataU.data.dateAdded || ""
          });
        }

        if (dataU.data?.commandBanned?.length) {
          global.data.commandBanned.set(idUsers, dataU.data.commandBanned);
        }
      });

      if (global.config.autoCreateDB) {
        logger.log(`Database loaded: ${global.data.allThreadID.length} threads, ${global.data.allUserID.length} users`, "DATABASE");
      }
    } catch (error) {
      logger.log(`Database initialization error (ignored): ${error.message}`, "DEBUG");
    }
  })();

  // Enhanced handler objects
  const runObj = {
    api,
    Users,
    Threads,
    Currencies,
    logger,
    botSettings
  };

  // Load all handlers with error protection
  const handlers = {};
  
  // Load each handler individually with proper error handling
  try {
    handlers.handleCommand = require("./handle/handleCommand")(runObj);
  } catch (error) {
    logger.log(`handleCommand loading error: ${error.message}`, "DEBUG");
    handlers.handleCommand = () => {}; // Fallback empty function
  }

  try {
    handlers.handleCommandEvent = require("./handle/handleCommandEvent")(runObj);
  } catch (error) {
    logger.log(`handleCommandEvent loading error: ${error.message}`, "DEBUG");
    handlers.handleCommandEvent = () => {}; // Fallback empty function
  }

  try {
    handlers.handleReply = require("./handle/handleReply")(runObj);
  } catch (error) {
    logger.log(`handleReply loading error: ${error.message}`, "DEBUG");
    handlers.handleReply = () => {}; // Fallback empty function
  }

  try {
    handlers.handleReaction = require("./handle/handleReaction")(runObj);
  } catch (error) {
    logger.log(`handleReaction loading error: ${error.message}`, "DEBUG");
    handlers.handleReaction = () => {}; // Fallback empty function
  }

  try {
    handlers.handleEvent = require("./handle/handleEvent")(runObj);
  } catch (error) {
    logger.log(`handleEvent loading error: ${error.message}`, "DEBUG");
    handlers.handleEvent = () => {}; // Fallback empty function
  }

  try {
    handlers.handleRefresh = require("./handle/handleRefresh")(runObj);
  } catch (error) {
    logger.log(`handleRefresh loading error: ${error.message}`, "DEBUG");
    handlers.handleRefresh = () => {}; // Fallback empty function
  }

  try {
    handlers.handleCreateDatabase = require("./handle/handleCreateDatabase")(runObj);
  } catch (error) {
    logger.log(`handleCreateDatabase loading error: ${error.message}`, "DEBUG");
    handlers.handleCreateDatabase = () => {}; // Fallback empty function
  }

  // Enhanced approval system
  function checkApproval(event) {
    if (!event.isGroup) return true;

    const threadID = String(event.threadID);
    const isAdmin = global.config.ADMINBOT?.includes(event.senderID);

    // Load config safely
    let config = {};
    try {
      config = require("../config.json");
    } catch (e) {
      config = { APPROVAL: { approvedGroups: [], rejectedGroups: [] } };
    }

    const isApproved = config.APPROVAL?.approvedGroups?.includes(threadID);

    // Allow if admin or approved
    return isAdmin || isApproved;
  }

  // Rate limiting function
  function checkRateLimit(userID) {
    if (!botSettings.RATE_LIMITING?.ENABLED) return true;

    const now = Date.now();
    const lastActivity = userLastActivity.get(userID) || 0;
    const minInterval = botSettings.RATE_LIMITING.MIN_MESSAGE_INTERVAL || 2000;

    if (now - lastActivity < minInterval) {
      return false;
    }

    userLastActivity.set(userID, now);
    return true;
  }

  // Enhanced error handler
  function handleError(error, context = "Unknown") {
    if (!error) return;

    const errorStr = error.toString().toLowerCase();

    // Ignore common errors
    const ignorableErrors = [
      'rate limit',
      'enoent',
      'network',
      'timeout',
      'connection reset',
      'does not exist in database',
      'you can\'t use this feature',
      'took too long to execute'
    ];

    if (ignorableErrors.some(err => errorStr.includes(err))) {
      return; // Silently ignore
    }

    logger.log(`${context} error: ${error.message}`, "DEBUG");
  }

  // Main event handler
  return async (event) => {
    try {
      if (!event || !event.type) return;

      // Skip ready events
      if (event.type === 'ready') return;

      // Check approval for group messages
      if (event.isGroup && !checkApproval(event)) {
        return;
      }

      // Rate limiting
      if (!checkRateLimit(event.senderID)) {
        return;
      }

      const listenObj = { event };

      // Handle different event types with enhanced error protection
      switch (event.type) {
        case "message":
        case "message_reply":
        case "message_unsend":
          // Execute handlers in sequence with proper error handling
          if (handlers.handleCreateDatabase) {
            try {
              await handlers.handleCreateDatabase(listenObj);
            } catch (error) {
              handleError(error, "handleCreateDatabase");
            }
          }

          if (handlers.handleCommand) {
            try {
              await handlers.handleCommand(listenObj);
            } catch (error) {
              handleError(error, "handleCommand");
            }
          }

          if (handlers.handleReply) {
            try {
              await handlers.handleReply(listenObj);
            } catch (error) {
              handleError(error, "handleReply");
            }
          }

          if (handlers.handleCommandEvent) {
            try {
              await handlers.handleCommandEvent(listenObj);
            } catch (error) {
              handleError(error, "handleCommandEvent");
            }
          }
          break;

        case "event":
          if (handlers.handleEvent) {
            try {
              await handlers.handleEvent(listenObj);
            } catch (error) {
              handleError(error, "handleEvent");
            }
          }

          if (handlers.handleRefresh) {
            try {
              await handlers.handleRefresh(listenObj);
            } catch (error) {
              handleError(error, "handleRefresh");
            }
          }
          break;

        case "message_reaction":
          if (handlers.handleReaction) {
            try {
              await handlers.handleReaction(listenObj);
            } catch (error) {
              handleError(error, "handleReaction");
            }
          }
          break;

        case "change_thread_image":
          // Handle silently
          break;

        default:
          // Unknown event type - ignore
          break;
      }

    } catch (error) {
      handleError(error, "MainEventHandler");
    }
  };
};
