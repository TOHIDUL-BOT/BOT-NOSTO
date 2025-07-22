const fs = require('fs');
const fsPromises = require('fs').promises;
const configPath = require('path').join(__dirname, '../../config.json');

module.exports.config = {
  name: "pendingApproval",
  eventType: ["log:thread-add"],
  version: "1.0.0",
  credits: "TOHI-BOT-HUB",
  description: "Auto approve or handle pending groups"
};

module.exports.run = async function({ api, event, Users, Threads }) {
  try {
    const { threadID, author, logMessageType } = event;

    // Only handle when bot is added to group
    if (logMessageType !== "log:thread-add") return;

    // Check if bot was added
    const botID = api.getCurrentUserID();
    if (!event.logMessageData || !event.logMessageData.addedParticipants) return;

    const addedBot = event.logMessageData.addedParticipants.find(p => p.userFbId === botID);
    if (!addedBot) return;

    // Load config
    let config = {};
    try {
      const configData = await fsPromises.readFile(configPath, 'utf8');
      config = JSON.parse(configData);
    } catch (error) {
      // Initialize default config if file doesn't exist
      config = {
        AUTO_APPROVE: { enabled: true, approvedGroups: [] },
        APPROVAL: { approvedGroups: [], pendingGroups: [], rejectedGroups: [] }
      };
    }

    // Initialize approval arrays if they don't exist
    config.APPROVAL = config.APPROVAL || {};
    config.APPROVAL.approvedGroups = config.APPROVAL.approvedGroups || [];
    config.APPROVAL.pendingGroups = config.APPROVAL.pendingGroups || [];
    config.APPROVAL.rejectedGroups = config.APPROVAL.rejectedGroups || [];

    const threadInfo = await api.getThreadInfo(threadID);
    const groupName = threadInfo.name || "Unnamed Group";

    if (config.AUTO_APPROVE?.enabled) {
      // Auto approve
      if (!config.APPROVAL.approvedGroups.includes(threadID)) {
        config.APPROVAL.approvedGroups.push(threadID);

        // Save config
        await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2));

        api.sendMessage(
          `✅ Group "${groupName}" has been automatically approved!\n\n` +
          `📝 Type ${global.config.PREFIX || '/'}help to see available commands.\n` +
          `👑 Bot Admin: ${global.config.ADMINBOT?.[0] || 'Unknown'}`,
          threadID
        );
      }
    } else {
      // Manual approval required - Default behavior
      if (!config.APPROVAL.pendingGroups.includes(threadID) && 
          !config.APPROVAL.approvedGroups.includes(threadID) &&
          !config.APPROVAL.rejectedGroups.includes(threadID)) {
        
        config.APPROVAL.pendingGroups.push(threadID);

        // Save config
        await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2));

        api.sendMessage(
          `⏳ Group "${groupName}" এ বট add হয়েছে কিন্তু এখনো approve করা হয়নি।\n\n` +
          `🚫 Bot এর কোনো command কাজ করবে না যতক্ষণ না admin approve করে।\n` +
          `⏰ Admin এর approval এর জন্য অপেক্ষা করুন।\n\n` +
          `👑 Bot Admin: ${global.config.ADMINBOT?.[0] || 'Unknown'}`,
          threadID
        );

        // Notify admins
        const adminMessage = `🔔 নতুন গ্রুপ approval এর জন্য অপেক্ষা করছে:\n\n` +
          `📝 Group Name: ${groupName}\n` +
          `🆔 Group ID: ${threadID}\n` +
          `👥 Members: ${threadInfo.participantIDs?.length || 0}\n` +
          `📅 Added: ${new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}\n\n` +
          `✅ Approve করতে: ${global.config.PREFIX || '/'}approve\n` +
          `❌ Reject করতে: bot কে group থেকে remove করুন`;

        if (global.config.ADMINBOT && Array.isArray(global.config.ADMINBOT)) {
          global.config.ADMINBOT.forEach(adminID => {
            api.sendMessage(adminMessage, adminID);
          });
        }
      }
    }

  } catch (error) {
    console.error('Pending approval error:', error);
  }
};