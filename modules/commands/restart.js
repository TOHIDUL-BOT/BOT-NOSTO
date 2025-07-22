
module.exports.config = {
  name: "restart",
  version: "6.0.0",
  hasPermssion: 2,
  credits: "TOHIDUL",
  description: "Complete system restart without turning off bot - reload all configs, modules & events",
  usePrefix: true,
  commandCategory: "Admin",
  usages: "restart [reason]",
  cooldowns: 20
};

async function unsendAfter(api, messageID, delay = 4000) {
  setTimeout(() => {
    api.unsendMessage(messageID);
  }, delay);
}

module.exports.run = async function ({ api, event, args, logger }) {
  const { threadID, messageID, senderID } = event;
  const moment = require('moment-timezone');
  const fs = require('fs-extra');

  // Only allow this UID
  if (senderID !== "100092006324917") {
    return api.sendMessage("❌ শুধুমাত্র বট মালিক এই কমান্ড ব্যবহার করতে পারবেন!", threadID, messageID);
  }

  try {
    const reason = args.join(' ') || 'Manual system restart';
    const restartTime = moment().tz('Asia/Dhaka').format('DD/MM/YYYY HH:mm:ss');

    // Compact stylish restart notification
    const restartMsg = `╔═══════════════════════╗
║ 🔄 𝐒𝐘𝐒𝐓𝐄𝐌 𝐑𝐄𝐒𝐓𝐀𝐑𝐓... ║
╚═══════════════════════╝

🎯 𝐓𝐎𝐇𝐈-𝐁𝐎𝐓 𝐇𝐔𝐁
👑 𝐁𝐲: 𝐓𝐎𝐇𝐈𝐃𝐔𝐋
📝 𝐑𝐞𝐚𝐬𝐨𝐧: ${reason}
⏰ ${restartTime}

🔄 Restarting all systems...
━━━━━━━━━━━━━━━━━━━━━━━━`;

    api.sendMessage(restartMsg, threadID, async (err, info) => {
      if (info && info.messageID) unsendAfter(api, info.messageID, 3000);

      // Clear all caches and reload everything
      const commandsPath = `${global.client.mainPath}/modules/commands`;
      const eventsPath = `${global.client.mainPath}/modules/events`;

      // Clear all module caches
      Object.keys(require.cache).forEach(key => {
        if (key.includes('/modules/') || key.includes('/includes/') || key.includes('/utils/')) {
          delete require.cache[key];
        }
      });

      // Reset all client data
      global.client.commands.clear();
      global.client.events.clear();
      global.client.eventRegistered = [];
      global.client.handleSchedule = [];
      global.client.handleReaction = [];
      global.client.handleReply = [];

      // Reload commands and events
      let commandsLoaded = 0, eventsLoaded = 0;
      
      try {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
          try {
            const command = require(`${commandsPath}/${file}`);
            if (command.config && command.config.name && command.run) {
              global.client.commands.set(command.config.name, command);
              if (command.handleEvent) global.client.eventRegistered.push(command.config.name);
              commandsLoaded++;
            }
          } catch (cmdError) {
            console.error(`Failed to reload command ${file}:`, cmdError.message);
          }
        }

        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
          try {
            const evt = require(`${eventsPath}/${file}`);
            if (evt.config && evt.config.name && evt.run) {
              global.client.events.set(evt.config.name, evt);
              global.client.eventRegistered.push(evt.config.name);
              eventsLoaded++;
            }
          } catch (evtError) {
            console.error(`Failed to reload event ${file}:`, evtError.message);
          }
        }
      } catch (reloadError) {
        console.error('Reload error:', reloadError);
      }

      // Force garbage collection
      if (global.gc && typeof global.gc === 'function') {
        global.gc();
      }

      setTimeout(() => {
        const completeTime = moment().tz('Asia/Dhaka').format('DD/MM/YYYY HH:mm:ss');
        const successMsg = `╔═══════════════════════╗
║ ✅ 𝐑𝐄𝐒𝐓𝐀𝐑𝐓 𝐃𝐎𝐍𝐄! ║
╚═══════════════════════╝

🎉 𝐓𝐎𝐇𝐈-𝐁𝐎𝐓 𝐇𝐔𝐁
👑 𝐃𝐞𝐯: 𝐓𝐎𝐇𝐈𝐃𝐔𝐋
🚀 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐎𝐧𝐥𝐢𝐧𝐞 ✅
⏰ ${completeTime}

📊 𝐒𝐓𝐀𝐓𝐒:
🔧 Commands: ${commandsLoaded}
⚡ Events: ${eventsLoaded}
🧹 All systems refreshed!

━━━━━━━━━━━━━━━━━━━━━━━━
✨ Ready to serve! ✨`;
        
        api.sendMessage(successMsg, threadID, (e, i) => {
          if (i && i.messageID) unsendAfter(api, i.messageID, 5000);
        });
      }, 2000);
    });
  } catch (error) {
    logger.log('❌ Restart command error: ' + error, "RESTART");
    api.sendMessage('❌ রিস্টার্ট ব্যর্থ হয়েছে। লগ চেক করুন।', threadID, messageID, (err, info) => {
      if (info && info.messageID) unsendAfter(api, info.messageID, 4000);
    });
  }
};
