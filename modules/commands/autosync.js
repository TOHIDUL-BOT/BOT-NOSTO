
const OWNER_ID = "100092006324917";

module.exports.config = {
  name: "autosync",
  version: "1.0.0", 
  hasPermssion: 2,
  credits: "TOHI-BOT-HUB",
  description: "Auto database sync control",
  commandCategory: "ADMIN",
  usages: "[start|stop|status|sync|restore]",
  cooldowns: 5,
  usePrefix: true
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (senderID !== OWNER_ID) {
    return api.sendMessage(`⛔️ শুধুমাত্র owner এই কমান্ড ব্যবহার করতে পারবেন!`, threadID, messageID);
  }

  const autoSync = require('../../utils/autoSyncDatabase');
  const command = (args[0] || "status").toLowerCase();

  try {
    switch (command) {
      case "start":
        autoSync.startAutoSync();
        return api.sendMessage("✅ Auto-sync চালু করা হয়েছে! প্রতি 2 মিনিট পর পর data PostgreSQL এ save হবে।", threadID, messageID);

      case "stop":
        autoSync.stopAutoSync();
        return api.sendMessage("⏹️ Auto-sync বন্ধ করা হয়েছে।", threadID, messageID);

      case "status":
        const status = autoSync.getStatus();
        const statusMsg = `📊 Auto-Sync Status:

🔄 চালু আছে: ${status.isRunning ? "✅ হ্যাঁ" : "❌ না"}
🗄️ PostgreSQL: ${status.postgresAvailable ? "✅ Connected" : "❌ Not Available"}
⏰ পরবর্তী sync: ${status.nextSyncIn}

💡 Commands:
• /autosync start - Auto-sync চালু করুন
• /autosync stop - Auto-sync বন্ধ করুন
• /autosync sync - এখনই sync করুন
• /autosync restore - Database থেকে restore করুন`;

        return api.sendMessage(statusMsg, threadID, messageID);

      case "sync":
        api.sendMessage("🔄 PostgreSQL এ data sync করা হচ্ছে...", threadID, messageID);
        const syncResult = await autoSync.syncToPostgreSQL();
        
        if (syncResult) {
          return api.sendMessage("✅ সব data সফলভাবে PostgreSQL এ sync হয়েছে!", threadID, messageID);
        } else {
          return api.sendMessage("❌ Data sync করতে সমস্যা হয়েছে!", threadID, messageID);
        }

      case "restore":
        api.sendMessage("🔄 PostgreSQL থেকে data restore করা হচ্ছে...", threadID, messageID);
        const restoreResult = await autoSync.syncFromPostgreSQL();
        
        if (restoreResult) {
          return api.sendMessage("✅ সব data সফলভাবে PostgreSQL থেকে restore হয়েছে!", threadID, messageID);
        } else {
          return api.sendMessage("❌ Data restore করতে সমস্যা হয়েছে!", threadID, messageID);
        }

      default:
        return api.sendMessage("❌ অবৈধ command! ব্যবহার করুন: start, stop, status, sync, restore", threadID, messageID);
    }
  } catch (error) {
    console.error("Auto-sync command error:", error);
    return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};
