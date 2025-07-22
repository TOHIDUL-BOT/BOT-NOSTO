module.exports.config = {
  name: "autosetname",
  version: "1.0.0",
  hasPermssion: 2,
  usePrefix: true,
  credits: "TOHI-BOT-HUB",
  description: "Set bot nickname in all approved groups - Always enabled by default",
  commandCategory: "BOT ADMIN",
  usages: "[all|status]",
  cooldowns: 10
};

const fs = require('fs-extra');
const path = require('path');

// Set bot nickname with retry mechanism
async function setBotNickname(api, threadID, retries = 3) {
  try {
    const botID = api.getCurrentUserID();
    const botName = global.config.BOTNAME || "TOHI-BOT";
    const prefix = global.config.PREFIX || "/";

    const nickname = `[ ${prefix} ] • ${botName}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await api.changeNickname(nickname, threadID, botID);
        return { success: true, nickname };
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  } catch (error) {
    console.error(`Failed to set nickname in group ${threadID}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const command = (args[0] || "status").toLowerCase();

  try {
    switch (command) {
      case "all":
        // Set nickname in all approved groups
        const configPath = require('path').join(__dirname, '../../config.json');
        let config;
        try {
          delete require.cache[require.resolve(configPath)];
          config = require(configPath);
        } catch (error) {
          return api.sendMessage("❌ কনফিগ ফাইল লোড করতে সমস্যা হয়েছে!", threadID, messageID);
        }

        if (!config.APPROVAL || !config.APPROVAL.approvedGroups || config.APPROVAL.approvedGroups.length === 0) {
          return api.sendMessage("❌ কোনো approved গ্রুপ পাওয়া যায়নি!", threadID, messageID);
        }

        api.sendMessage(`🔄 সব approved গ্রুপে বট nickname set করা হচ্ছে...

📊 মোট গ্রুপ: ${config.APPROVAL.approvedGroups.length}টি
⏳ অনুগ্রহ করে অপেক্ষা করুন...`, threadID);

        let successCount = 0;
        let failedCount = 0;
        const failedGroups = [];

        for (const groupId of config.APPROVAL.approvedGroups) {
          try {
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1500));

            const result = await setBotNickname(api, groupId);
            if (result.success) {
              successCount++;
              console.log(`✅ Nickname set successfully in group: ${groupId}`);
            } else {
              failedCount++;
              failedGroups.push(groupId);
              console.log(`❌ Failed to set nickname in group: ${groupId} - ${result.error}`);
            }
          } catch (error) {
            failedCount++;
            failedGroups.push(groupId);
            console.error(`Error processing group ${groupId}:`, error.message);
          }
        }

        const summaryMessage = `✅ Auto Nickname Set সম্পন্ন!

📊 রিপোর্ট:
✅ সফল: ${successCount}টি গ্রুপ
❌ ব্যর্থ: ${failedCount}টি গ্রুপ
📝 নিকনেম: [ ${global.config.PREFIX} ] • ${global.config.BOTNAME}

${failedCount > 0 ? `\n⚠️ ব্যর্থ গ্রুপ IDs:\n${failedGroups.slice(0, 5).join('\n')}${failedGroups.length > 5 ? '\n...(আরও আছে)' : ''}` : ''}

🚩 Made by TOHIDUL`;

        return api.sendMessage(summaryMessage, threadID, messageID);

      case "status":
      default:
        const statusMessage = `🤖 Auto Set Name Status

📊 বর্তমান অবস্থা: ✅ সবসময় চালু (Always Enabled)
📝 বর্তমান নিকনেম: [ ${global.config.PREFIX} ] • ${global.config.BOTNAME}
🔄 অটো সেট: নতুন গ্রুপে add হলে automatic nickname set হয়

📋 কমান্ড তালিকা:
• ${global.config.PREFIX}autosetname all - সব গ্রুপে সেট করুন
• ${global.config.PREFIX}autosetname status - স্ট্যাটাস দেখুন

⚡ বিশেষ তথ্য:
• বট নতুন গ্রুপে add হলে auto nickname set হবে
• কোনো on/off করার প্রয়োজন নেই
• সবসময় active থাকবে

🚩 Made by TOHIDUL`;

        return api.sendMessage(statusMessage, threadID, messageID);
    }
  } catch (error) {
    console.error('AutoSetName command error:', error);
    return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};

// Export the setBotNickname function for use in events
module.exports.setBotNickname = setBotNickname;

// Always return enabled status since it's permanent
module.exports.getAutoSetNameConfig = function() {
  return { enabled: true, permanent: true };
};