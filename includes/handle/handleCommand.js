const threadHealthChecker = require("../../utils/threadHealthChecker");

module.exports = function ({ api, Users, Threads, Currencies, logger, botSettings }) {
  const moment = require("moment-timezone");
  const axios = require("axios");

  // Levenshtein Distance for typo correction
  function getLevenshtein(a, b) {
    const matrix = [];
    let i;
    for (i = 0; i <= b.length; i++) matrix[i] = [i];
    let j;
    for (j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (i = 1; i <= b.length; i++) {
      for (j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  function shouldIgnoreError(error) {
    if (!error) return true;
    const errorStr = error.toString().toLowerCase();
    const ignorablePatterns = [
      'rate limit', 'enoent', 'network timeout', 'connection reset',
      'does not exist in database', 'you can\'t use this feature', 'took too long to execute',
      'command timeout', 'execution timeout', 'request timeout', 'socket timeout', 'network error',
      'api error', 'facebook error', 'permission denied', 'access denied', 'invalid session',
      'login required', 'cannot read properties of undefined', 'getname is not a function', 'mqtt',
      'attachment url', 'has no valid run or onstart function', 'command has no valid', 'no valid function',
      'function is not defined'
    ];
    return ignorablePatterns.some(pattern => errorStr.includes(pattern));
  }

  const cooldowns = new Map();
  const userActivity = new Map();
  function checkCooldown(userID, commandName, cooldownTime) {
    if (!cooldownTime || cooldownTime <= 0) return true;
    const key = `${userID}_${commandName}`;
    const now = Date.now();
    const lastUsed = cooldowns.get(key) || 0;
    if (now - lastUsed < cooldownTime * 1000) return false;
    cooldowns.set(key, now);
    return true;
  }

  async function executeCommand(command, Obj, commandName) {
    try {
      if (typeof command.run === 'function') return await command.run(Obj);
      else if (typeof command.onStart === 'function') return await command.onStart(Obj);
      else if (typeof command.start === 'function') return await command.start(Obj);
      else throw new Error(`Command ${commandName} has no valid execution function`);
    } catch (error) {
      throw error;
    }
  }

  return async function handleCommand({ event }) {
    try {
      if (!event || !event.body) return;
      const { api } = global.client;
      const { commands } = global.client;
      const { threadID, messageID, senderID } = event;

      // Check if thread is disabled
      if (threadHealthChecker && threadHealthChecker.isThreadDisabled && threadHealthChecker.isThreadDisabled(threadID)) return;

      // Group approval - Always reload config for latest data
      const fs = require('fs');
      const configPath = require('path').join(__dirname, '../../config.json');
      let approvalConfig = {};
      try {
        delete require.cache[require.resolve(configPath)];
        const configData = fs.readFileSync(configPath, 'utf8');
        approvalConfig = JSON.parse(configData);
      } catch (error) {
        approvalConfig = { APPROVAL: { approvedGroups: [] } };
      }
      if (!approvalConfig.APPROVAL) {
        approvalConfig.APPROVAL = { approvedGroups: [], pendingGroups: [], rejectedGroups: [] };
      }

      // Unapproved group block logic
      const isOwner = global.config.ADMINBOT && global.config.ADMINBOT.includes(senderID);
      const isApproved = approvalConfig.APPROVAL.approvedGroups.includes(String(threadID));
      const threadIsGroup = event.threadID && event.threadID !== event.senderID;
      const messageBody = event.body.trim();

      if (threadIsGroup && !isApproved) {
        const prefix = global.config.PREFIX || "/";
        const commandName = messageBody.replace(prefix, "").split(" ")[0].toLowerCase();
        if (commandName === "approve" && isOwner) {
          // Allow owner to run approve command in unapproved group
        } else {
          // Block ALL other commands in unapproved group (regardless of usePrefix)
          return;
        }
      }

      // Get thread settings
      const threadData = global.data.threadData.get(threadID) || {};
      const prefix = threadData.PREFIX || global.config.PREFIX || "/";

      // PREFIX-ONLY INPUT
      if (messageBody === prefix) {
        let prefixCommand = commands.get("prefix");
        if (!prefixCommand) {
          for (const [name, cmd] of commands) {
            if (cmd.config.aliases && Array.isArray(cmd.config.aliases)) {
              if (cmd.config.aliases.includes("prefix")) {
                prefixCommand = cmd;
                break;
              }
            }
          }
        }
        if (prefixCommand && typeof prefixCommand.run === "function") {
          return await prefixCommand.run({
            api,
            event,
            args: [],
            Users,
            Threads,
            Currencies,
            permssion: prefixCommand.config.permission || 0,
            getText: (k, ...a) => k,
            logger
          });
        } else {
          return api.sendMessage(`Prefix command not found!`, threadID, messageID);
        }
      }

      let msg = messageBody;
      let isPrefixed = false;
      if (msg.startsWith(prefix)) {
        isPrefixed = true;
        msg = msg.slice(prefix.length).trim();
      }

      // Parse command name & args
      let cmdName = msg.split(/\s+/)[0].toLowerCase();
      const args = msg.split(/\s+/).slice(1);

      // Enhanced command matching with typo correction
      let command = commands.get(cmdName);
      let originalCmdName = cmdName;

      if (!command) {
        for (const [name, cmd] of commands) {
          if (cmd.config.aliases && Array.isArray(cmd.config.aliases)) {
            if (cmd.config.aliases.includes(cmdName)) {
              command = cmd;
              break;
            }
          }
        }
      }

      // Typo correction
      if (!command) {
        const allCmdNames = Array.from(commands.keys());
        for (const [name, cmd] of commands) {
          if (cmd.config.aliases && Array.isArray(cmd.config.aliases)) {
            allCmdNames.push(...cmd.config.aliases);
          }
        }
        let bestMatch = null;
        let bestDistance = 99;
        for (const validCmd of allCmdNames) {
          if (Math.abs(validCmd.length - cmdName.length) > 2) continue;
          const distance = getLevenshtein(cmdName, validCmd);
          let maxAllowedDistance = validCmd.length >= 5 ? 2 : 1;
          const minLength = Math.min(cmdName.length, validCmd.length);
          const prefixLength = Math.min(3, minLength);
          const prefixDistance = getLevenshtein(
            cmdName.substring(0, prefixLength),
            validCmd.substring(0, prefixLength)
          );
          if (distance <= maxAllowedDistance && prefixDistance <= 1 && distance < bestDistance) {
            bestDistance = distance;
            bestMatch = validCmd;
          }
        }
        if (bestMatch && bestDistance <= 2) {
          let correctedCommand = commands.get(bestMatch);
          if (!correctedCommand) {
            for (const [name, cmd] of commands) {
              if (cmd.config.aliases && cmd.config.aliases.includes(bestMatch)) {
                correctedCommand = cmd;
                break;
              }
            }
          }
          if (correctedCommand) {
            command = correctedCommand;
            cmdName = bestMatch;
          }
        }
      }

      if (!command) return;

      // STRICT usePrefix validation
      const commandConfig = command.config;
      if (commandConfig.usePrefix === true && !isPrefixed) return;
      if (commandConfig.usePrefix === false && isPrefixed) return;
      if (commandConfig.usePrefix === undefined && !isPrefixed) return;

      // --- PERMISSION SYSTEM (MODIFIED AS YOU REQUESTED) ---
      // hasPermssion: 0 = Everyone, 1 = Group Admin and Bot Admin, 2 = Only Bot Admin
      const hasPermssion = commandConfig.hasPermssion ?? commandConfig.permission ?? 0;
      let isGroupAdmin = false;
      let isBotAdmin = false;
      if (global.config.ADMINBOT?.includes(senderID)) isBotAdmin = true;
      if (threadIsGroup) {
        try {
          const threadInfo = await api.getThreadInfo(threadID);
          isGroupAdmin = threadInfo.adminIDs?.map(a => String(a.id)).includes(String(senderID));
        } catch (e) { }
      }
      if (hasPermssion === 1 && !(isGroupAdmin || isBotAdmin)) {
        return api.sendMessage("[ only group admin and bot admin can use this command ]", threadID, messageID);
      }
      if (hasPermssion === 2 && !isBotAdmin) {
        return api.sendMessage("[ ONLY BOT ADMIN CAN USE THIS COMMAND ]", threadID, messageID);
      }
      // hasPermssion 0: everyone

      // Cooldown check
      if (commandConfig.cooldowns && !checkCooldown(senderID, cmdName, commandConfig.cooldowns)) {
        return api.sendMessage(
          `『⏳』𝙏𝙊𝙃𝙄-𝘽𝙊𝙏 𝙃𝙐𝘽\n━━━━━━━━━━━━━━━\n⚠️ 𝙋𝙡𝙚𝙖𝙨𝙚 𝙬𝙖𝙞𝙩 𝙗𝙚𝙛𝙤𝙧𝙚 𝙪𝙨𝙞𝙣𝙜 𝙩𝙝𝙞𝙨 𝙘𝙤𝙢𝙢𝙖𝙣𝙙 𝙖𝙜𝙖𝙞𝙣!\n━━━━━━━━━━━━━━━\n『🔰』𝑪𝒓𝒆𝒅𝒊𝒕: 𝑻𝑩𝑯`,
          threadID, messageID
        );
      }

      // Thread/User ban check
      const threadBanned = global.data.threadBanned.has(threadID);
      const userBanned = global.data.userBanned.has(senderID);
      const commandBanned = global.data.commandBanned.get(threadID)?.includes(cmdName) ||
        global.data.commandBanned.get(senderID)?.includes(cmdName);

      if (threadBanned || userBanned || commandBanned) {
        return api.sendMessage(
          `『🚫』𝙏𝙊𝙃𝙄-𝘽𝙊𝙏 𝙃𝙐𝘽\n━━━━━━━━━━━━━━━\n❌ 𝙔𝙤𝙪 𝙤𝙧 𝙩𝙝𝙞𝙨 𝙩𝙝𝙧𝙚𝙖𝙙 𝙞𝙨 𝙗𝙖𝙣𝙣𝙚𝙙 𝙛𝙧𝙤𝙢 𝙪𝙨𝙞𝙣𝙜 𝙘𝙤𝙢𝙢𝙖𝙣𝙙𝙨!\n━━━━━━━━━━━━━━━\n『🔰』𝑪𝒓𝒆𝒅𝒊𝒕: 𝑻𝑩𝑯`,
          threadID, messageID
        );
      }

      // Rate limiting
      if (botSettings?.RATE_LIMITING?.ENABLED) {
        const lastActivity = userActivity.get(senderID) || 0;
        const now = Date.now();
        const interval = botSettings.RATE_LIMITING.MIN_MESSAGE_INTERVAL || 8000;
        if (now - lastActivity < interval) {
          return api.sendMessage(
            `『⏱️』𝙏𝙊𝙃𝙄-𝘽𝙊𝙏 𝙃𝙐𝘽\n━━━━━━━━━━━━━━━\n⚡️ 𝙏𝙤𝙤 𝙈𝙖𝙣𝙮 𝙍𝙚𝙦𝙪𝙚𝙨𝙩𝙨! 𝙋𝙡𝙚𝙖𝙨𝙚 𝙨𝙡𝙤𝙬 𝙙𝙤𝙬𝙣.\n━━━━━━━━━━━━━━━\n『🔰』𝑪𝒓𝒆𝒅𝒊𝒕: 𝑻𝑩𝑯`,
            threadID, messageID
          );
        }
        userActivity.set(senderID, now);
      }

      // Stylish fallback messages
      const fallbackMessages = {
        "moduleInfo": `
『✦⎯⎯⎯⎯⎯ TOHI-BOT HUB ⎯⎯⎯⎯⎯✦』
🌟 𝙈𝙊𝘿𝙐𝙇𝙀 𝙄𝙉𝙁𝙊 🌟
━━━━━━━━━━━━━━━━━━━━━
🆔 𝙉𝙖𝙢𝙚        : %1
💡 𝘿𝙚𝙨𝙘         : %2
📖 𝙐𝙨𝙖𝙜𝙚        : %3
📂 𝘾𝙖𝙩𝙚𝙜𝙤𝙧𝙮    : %4
⏳ 𝘾𝙤𝙤𝙡𝙙𝙤𝙬𝙣    : %5s
🔑 𝙋𝙚𝙧𝙢𝙞𝙨𝙨𝙞𝙤𝙣  : %6
━━━━━━━━━━━━━━━━━━━━━
『🔰』𝑪𝒓𝒆𝒅𝒊𝒕: 𝙈𝙖𝙙𝙚 𝙗𝙮 𝙏𝙊𝙃𝙄-𝘽𝙊𝙏-𝙃𝙐𝘽
`,
        "helpList": `✨ 𝙏𝙊𝙃𝙄-𝘽𝙊𝙏 𝙃𝙐𝘽 𝙝𝙖𝙨 %1 𝙘𝙤𝙢𝙢𝙖𝙣𝙙𝙨 𝙖𝙫𝙖𝙞𝙡𝙖𝙗𝙡𝙚!
🔍 𝙏𝙄𝙋: 𝙏𝙮𝙥𝙚 %2help [command name] for details!`,
        "user": "User",
        "adminGroup": "Admin Group",
        "adminBot": "Admin Bot",
        "on": "on",
        "off": "off",
        "successText": "Success!",
        "error": "An error occurred",
        "missingInput": "Please provide required input",
        "noPermission": "You don't have permission to use this command",
        "cooldown": "Please wait before using this command again",
        "levelup": "Congratulations {name}, you leveled up to level {level}!",
        "reason": "Reason",
        "at": "at",
        "banSuccess": "User banned successfully",
        "unbanSuccess": "User unbanned successfully"
      };

      const fallbackGetText = (key, ...args) => {
        try {
          if (global.getText && typeof global.getText === 'function') {
            const result = global.getText(key, ...args);
            if (result && result !== key) {
              return result;
            }
          }
        } catch (e) { }
        if (fallbackMessages[key]) {
          let message = fallbackMessages[key];
          for (let i = 0; i < args.length; i++) {
            message = message.replace(new RegExp(`%${i + 1}`, 'g'), args[i] || '');
            message = message.replace(new RegExp(`\\{${i + 1}\\}`, 'g'), args[i] || '');
          }
          return message;
        }
        return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
      };

      // Create enhanced run object
      const Obj = {
        api,
        event,
        args,
        Users,
        Threads,
        Currencies,
        permssion: hasPermssion,
        getText: fallbackGetText,
        logger
      };

      // Enhanced user info
      try {
        if (!global.data.userName.has(senderID)) {
          const userInfo = await api.getUserInfo(senderID);
          if (userInfo && userInfo[senderID]) {
            global.data.userName.set(senderID, userInfo[senderID].name || "Unknown User");
          }
        }
      } catch (e) { }

      const userName = global.data.userName.get(senderID) || "Unknown User";
      logger.log(`Command "${cmdName}" used by ${userName} (${senderID})`, "COMMAND");

      // Execute command with enhanced error handling
      try {
        await executeCommand(command, Obj, cmdName);
      } catch (error) {
        if (error.message && error.message.includes('Missing catch or finally after try')) {
          logger.log(`Syntax error in command "${cmdName}": ${error.message}`, "ERROR");
          return api.sendMessage(`⚠️ Command "${cmdName}" has a syntax error and needs to be fixed.`, threadID, messageID);
        }
        if (shouldIgnoreError(error)) {
          logger.log(`Command "${cmdName}" issue: ${error.message}`, "DEBUG");
        } else {
          logger.log(`Command "${cmdName}" error: ${error.message}`, "ERROR");
        }
      }
    } catch (error) {
      if (!shouldIgnoreError(error)) {
        logger.log(`HandleCommand error: ${error.message}`, "ERROR");
      }
    }
  };
};