
module.exports.config = {
  name: "reboot",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "TOHIDUL",
  description: "Reload all bot modules, events and commands without turning off bot",
  commandCategory: "bot admin",
  usages: "reboot",
  cooldowns: 15,
  usePrefix: true,
  dependencies: {
    "fs-extra": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const fs = require("fs-extra");
  const moment = require('moment-timezone');

  // Only allow owner UID
  if (senderID !== "100092006324917") {
    return api.sendMessage("❌ এই কমান্ডটি কেবল বট মালিক ব্যবহার করতে পারবে!", threadID, messageID);
  }

  try {
    const rebootTime = moment().tz('Asia/Dhaka').format('DD/MM/YYYY HH:mm:ss');
    
    // Send stylish reboot start message
    const rebootMsg = await api.sendMessage(
      `╔══════════════════════════════╗
║   🔄 𝐑𝐄𝐁𝐎𝐎𝐓 𝐈𝐍𝐈𝐓𝐈𝐀𝐋𝐈𝐙𝐈𝐍𝐆...   ║
╚══════════════════════════════╝

🎯 𝐓𝐎𝐇𝐈-𝐁𝐎𝐓 𝐇𝐔𝐁 𝐑𝐄𝐁𝐎𝐎𝐓
👑 𝐁𝐲: 𝐓𝐎𝐇𝐈𝐃𝐔𝐋
⏰ 𝐓𝐢𝐦𝐞: ${rebootTime}

🔄 Clearing cache & reloading modules...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      threadID
    );

    // Clear all command/event cache
    const commandsPath = `${global.client.mainPath}/modules/commands`;
    const eventsPath = `${global.client.mainPath}/modules/events`;

    Object.keys(require.cache).forEach(key => {
      if (key.includes('/modules/commands/') || key.includes('/modules/events/')) {
        delete require.cache[key];
      }
    });

    // Clear client data but keep bot running
    global.client.commands.clear();
    global.client.events.clear();
    global.client.eventRegistered = [];
    global.client.handleSchedule = [];
    global.client.handleReaction = [];
    global.client.handleReply = [];

    // Update message: cache cleared
    api.editMessage(
      `╔══════════════════════════════╗
║   🔄 𝐑𝐄𝐁𝐎𝐎𝐓 𝐈𝐍 𝐏𝐑𝐎𝐆𝐑𝐄𝐒𝐒...   ║
╚══════════════════════════════╝

🎯 𝐓𝐎𝐇𝐈-𝐁𝐎𝐓 𝐇𝐔𝐁 𝐑𝐄𝐁𝐎𝐎𝐓
👑 𝐁𝐲: 𝐓𝐎𝐇𝐈𝐃𝐔𝐋
⏰ ${rebootTime}

✅ Cache cleared successfully!
🔄 Reloading commands & events...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      rebootMsg.messageID, threadID
    );

    // Reload all commands
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    let commandsLoaded = 0, commandsFailed = 0;
    
    for (const file of commandFiles) {
      try {
        delete require.cache[require.resolve(`${commandsPath}/${file}`)];
        const command = require(`${commandsPath}/${file}`);
        if (command.config && command.config.name && command.run) {
          global.client.commands.set(command.config.name, command);
          if (command.handleEvent) global.client.eventRegistered.push(command.config.name);
          commandsLoaded++;
        }
      } catch (error) {
        commandsFailed++;
        console.error(`Failed to reload command ${file}:`, error.message);
      }
    }

    // Reload all events
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    let eventsLoaded = 0, eventsFailed = 0;
    
    for (const file of eventFiles) {
      try {
        delete require.cache[require.resolve(`${eventsPath}/${file}`)];
        const evt = require(`${eventsPath}/${file}`);
        if (evt.config && evt.config.name && evt.run) {
          global.client.events.set(evt.config.name, evt);
          global.client.eventRegistered.push(evt.config.name);
          eventsLoaded++;
        }
      } catch (error) {
        eventsFailed++;
        console.error(`Failed to reload event ${file}:`, error.message);
      }
    }

    // Memory cleanup
    if (global.gc && typeof global.gc === 'function') {
      global.gc();
    }

    // Final success message
    const successMsg = `╔══════════════════════════════╗
║   ✅ 𝐑𝐄𝐁𝐎𝐎𝐓 𝐂𝐎𝐌𝐏𝐋𝐄𝐓𝐄𝐃!   ║
╚══════════════════════════════╝

🎉 𝐓𝐎𝐇𝐈-𝐁𝐎𝐓 𝐇𝐔𝐁 
👑 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫: 𝐓𝐎𝐇𝐈𝐃𝐔𝐋
🚀 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐎𝐧𝐥𝐢𝐧𝐞 & 𝐑𝐞𝐚𝐝𝐲!

📊 𝐑𝐄𝐋𝐎𝐀𝐃 𝐒𝐓𝐀𝐓𝐒:
🔧 Commands: ${commandsLoaded} ✅ | ${commandsFailed} ❌
⚡ Events: ${eventsLoaded} ✅ | ${eventsFailed} ❌
🧹 Memory optimized & cache cleared!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ All modules reloaded successfully! ✨`;

    api.editMessage(successMsg, rebootMsg.messageID, threadID);

    console.log(`[REBOOT] Bot modules reloaded by ${senderID}. Commands: ${commandsLoaded}, Events: ${eventsLoaded}`);

  } catch (error) {
    console.error("Reboot error:", error);
    api.sendMessage(`❌ রিবুট করতে সমস্যা হয়েছে:\n${error.message}`, threadID, messageID);
  }
};
