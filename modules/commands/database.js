const OWNER_ID = "100092006324917";

module.exports.config = {
  name: "database",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "TOHI-BOT-HUB",
  description: "Database management commands",
  commandCategory: "ADMIN",
  usages: "[backup|sync|status|export]",
  cooldowns: 5,
  usePrefix: true
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (senderID !== OWNER_ID) {
    return api.sendMessage(`⛔️ শুধুমাত্র owner (${OWNER_ID}) এই কমান্ড ব্যবহার করতে পারবেন!`, threadID, messageID);
  }

  const command = (args[0] || "status").toLowerCase();
  const PostgreSQL = require('../../includes/database/postgresql')();
  const dataSync = require('../../utils/syncData');

  try {
    switch (command) {
      case "status":
        const config = require('../../config.json');
        const databaseUrl = config.DATABASE?.DATABASE_URL || process.env.DATABASE_URL;

        if (!databaseUrl) {
          return api.sendMessage("❌ DATABASE_URL config.json অথবা environment এ নেই!", threadID, messageID);
        }

        try {
          const [users, threads, approvedGroups] = await Promise.all([
            PostgreSQL.getAllUsers(),
            PostgreSQL.getAllThreads(),
            PostgreSQL.getApprovedGroups()
          ]);

          const status = `📊 ডাটাবেস স্ট্যাটাস:

🏪 PostgreSQL: ✅ সংযুক্ত
👥 মোট ইউজার: ${users.length}
🏘️ মোট থ্রেড: ${threads.length}
✅ অনুমোদিত গ্রুপ: ${approvedGroups.length}

📝 গ্লোবাল ক্যাশ:
👤 allUserID: ${global.data.allUserID.length}
🏠 allThreadID: ${global.data.allThreadID.length}
💰 allCurrenciesID: ${global.data.allCurrenciesID.length}

💾 সবকিছু সংরক্ষিত এবং bot restart এর পর থেকে যাবে!`;

          return api.sendMessage(status, threadID, messageID);
        } catch (error) {
          return api.sendMessage(`❌ ডাটাবেস স্ট্যাটাস চেক করতে সমস্যা: ${error.message}`, threadID, messageID);
        }

      case "backup":
        api.sendMessage("🔄 সব ডাটা PostgreSQL এ backup করা হচ্ছে...", threadID, messageID);

        const backupResult = await dataSync.backupToPostgreSQL();
        if (backupResult) {
          return api.sendMessage("✅ সব ডাটা সফলভাবে PostgreSQL এ backup হয়েছে!", threadID, messageID);
        } else {
          return api.sendMessage("❌ Backup করতে সমস্যা হয়েছে!", threadID, messageID);
        }

      case "sync":
        api.sendMessage("🔄 PostgreSQL থেকে সব ডাটা sync করা হচ্ছে...", threadID, messageID);

        const syncResult = await dataSync.syncFromPostgreSQL();
        if (syncResult) {
          return api.sendMessage("✅ সব ডাটা সফলভাবে sync হয়েছে!", threadID, messageID);
        } else {
          return api.sendMessage("❌ Sync করতে সমস্যা হয়েছে!", threadID, messageID);
        }

      case "export":
        if (!process.env.DATABASE_URL) {
          return api.sendMessage("❌ DATABASE_URL নেই!", threadID, messageID);
        }

        const exportData = await PostgreSQL.backupAllData();
        if (exportData) {
          const fs = require('fs').promises;
          const exportPath = `./backup_${Date.now()}.json`;
          await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));

          return api.sendMessage(`✅ সব ডাটা এক্সপোর্ট হয়েছে: ${exportPath}

📊 এক্সপোর্ট ডাটা:
👥 ইউজার: ${exportData.users.length}
🏘️ থ্রেড: ${exportData.threads.length}
💰 কারেন্সি: ${exportData.currencies.length}
✅ অনুমোদিত গ্রুপ: ${exportData.approvedGroups.length}`, threadID, messageID);
        } else {
          return api.sendMessage("❌ ডাটা এক্সপোর্ট করতে সমস্যা!", threadID, messageID);
        }

      default:
        return api.sendMessage(`❌ অজানা কমান্ড! ব্যবহার করুন:
/database status - ডাটাবেস স্ট্যাটাস
/database backup - লোকাল ডাটা PostgreSQL এ backup
/database sync - PostgreSQL থেকে ডাটা sync
/database export - সব ডাটা JSON ফাইলে এক্সপোর্ট`, threadID, messageID);
    }
  } catch (error) {
    console.error("Database command error:", error);
    return api.sendMessage(`❌ কমান্ড এরর: ${error.message}`, threadID, messageID);
  }
};