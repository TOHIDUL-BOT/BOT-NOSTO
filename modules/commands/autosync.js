const OWNER_ID = "100092006324917";

module.exports.config = {
  name: "autosync",
  version: "1.0.0", 
  hasPermssion: 2,
  credits: "TOHI-BOT-HUB",
  description: "Auto database save status",
  commandCategory: "ADMIN",
  usages: "[status]",
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
    if (command === "status") {
      const status = autoSync.getStatus();
      let statusMsg = "📊 Auto-Save স্ট্যাটাস:\n\n";
      statusMsg += `🔄 চালু আছে: ${status.isRunning ? "✅ সবসময়" : "❌ না"}\n`;
      statusMsg += `📡 PostgreSQL: ${status.postgresAvailable ? "✅ সংযুক্ত" : "❌ সংযুক্ত নয়"}\n`;
      statusMsg += `⏰ পরবর্তী save: ${status.nextSaveIn}\n`;
      statusMsg += `🎯 Mode: ${status.mode}\n`;
      statusMsg += `💡 Note: Auto-save সবসময় চালু থাকে`;
      return api.sendMessage(statusMsg, threadID, messageID);
    } else {
      return api.sendMessage("📊 শুধুমাত্র 'status' command available। Auto-save সবসময় চালু থাকে।", threadID, messageID);
    }
  } catch (error) {
    console.error("Auto-sync command error:", error);
    return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};