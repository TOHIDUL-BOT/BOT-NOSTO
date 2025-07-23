const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "approve",
  version: "6.1.0",
  permission: 2,
  usePrefix: true,
  credits: "TOHIDUL (Easy Bangla Edition) + Copilot Config Rewrite",
  description: "Owner approval system — approved ছাড়া কোনো গ্রুপে বট কাজ করবে না। (config.json storage edition)",
  commandCategory: "BOT ADMIN",
  usages: "/approve [list|pending|help]",
  cooldowns: 5
};

const OWNER_ID = "100092006324917";
const CONFIG_PATH = path.join(__dirname, '../../config.json');

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch (e) {
    // Create default config if not found or corrupted
    const def = {
      "AUTO_APPROVE": { "enabled": true, "approvedGroups": [], "autoApproveMessage": false },
      "APPROVAL": { "approvedGroups": [], "pendingGroups": [], "rejectedGroups": [] }
    };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(def, null, 2));
    return def;
  }
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

module.exports.run = async function ({ api, event, args }) {
  if (event.senderID !== OWNER_ID) {
    return api.sendMessage(`⛔️ কেবল owner (${OWNER_ID}) approval দিতে পারবেন!`, event.threadID, event.messageID);
  }

  const { threadID, messageID, senderID } = event;

  let config = loadConfig();

  const command = (args[0] || "").toLowerCase();

  try {
    switch (command) {
      case "help": {
        const helpMsg = `📋 APPROVE COMMAND HELP:

🔸 /approve — বর্তমান গ্রুপ approve করুন
🔸 /approve list — সব approved গ্রুপের লিস্ট
🔸 /approve pending — pending গ্রুপের লিস্ট
🔸 /approve reject <groupID> — নির্দিষ্ট গ্রুপ reject করুন
🔸 /approve help — এই help মেসেজ

💡 Note: শুধু owner এই কমান্ড ব্যবহার করতে পারবেন।`;
        return api.sendMessage(helpMsg, threadID, messageID);
      }

      case "list": {
        const approvedGroups = config.APPROVAL.approvedGroups || [];
        if (approvedGroups.length === 0) {
          return api.sendMessage("📝 কোনো approved গ্রুপ নেই!", threadID, messageID);
        }
        let msg = `✅ APPROVED GROUPS (${approvedGroups.length}):\n\n`;
        approvedGroups.slice(0, 15).forEach((gid, i) => {
          msg += `${i + 1}. 🆔 ${gid}\n`;
        });
        if (approvedGroups.length > 15) {
          msg += `... এবং আরও ${approvedGroups.length - 15}টি গ্রুপ`;
        }
        return api.sendMessage(msg, threadID, messageID);
      }

      case "pending": {
        const pendingGroups = config.APPROVAL.pendingGroups || [];
        if (pendingGroups.length === 0) {
          return api.sendMessage("📝 কোনো pending গ্রুপ নেই!", threadID, messageID);
        }
        let msg = `⏳ PENDING GROUPS (${pendingGroups.length}):\n\n`;
        pendingGroups.slice(0, 10).forEach((gid, i) => {
          msg += `${i + 1}. 🆔 ${gid}\n`;
        });
        if (pendingGroups.length > 10) {
          msg += `... এবং আরও ${pendingGroups.length - 10}টি গ্রুপ`;
        }
        return api.sendMessage(msg, threadID, messageID);
      }

      case "reject": {
        const targetID = args[1];
        if (!targetID) {
          return api.sendMessage("❌ Group ID দিন!\nExample: /approve reject 12345", threadID, messageID);
        }
        // Remove from approved, add to rejected
        let changed = false;
        ["approvedGroups", "pendingGroups"].forEach(key => {
          const idx = config.APPROVAL[key].indexOf(targetID);
          if (idx !== -1) {
            config.APPROVAL[key].splice(idx, 1);
            changed = true;
          }
        });
        if (!config.APPROVAL.rejectedGroups.includes(targetID)) {
          config.APPROVAL.rejectedGroups.push(targetID);
          changed = true;
        }
        if (changed) {
          saveConfig(config);
          api.sendMessage(`❌ Group ${targetID} reject করা হয়েছে!`, threadID, messageID);
          // Try to notify group
          try {
            api.sendMessage(
              `❌ এই গ্রুপটি admin দ্বারা reject করা হয়েছে।\n\n` +
              `🚫 Bot এর কোনো command আর কাজ করবে না।\n` +
              `📞 আরো তথ্যের জন্য admin এর সাথে যোগাযোগ করুন।`,
              targetID
            );
          } catch (error) {
            // ignore
          }
        } else {
          api.sendMessage("❌ Group reject করতে সমস্যা হয়েছে!", threadID, messageID);
        }
        break;
      }

      default: {
        // Approve group (threadID or explicit argument)
        let targetID = threadID;
        if (args[0] && args[0] !== threadID && !isNaN(args[0])) {
          targetID = args[0];
        }

        // Convert to string for consistency
        targetID = String(targetID);

        // If already approved
        if (config.APPROVAL.approvedGroups.includes(targetID)) {
          return api.sendMessage(
            `✅ এই গ্রুপ ইতিমধ্যে approved!\n\n🆔 TID: ${targetID}`,
            threadID, messageID
          );
        }
        // If rejected
        if (config.APPROVAL.rejectedGroups.includes(targetID)) {
          return api.sendMessage(
            `❌ এই গ্রুপটি আগেই reject করা হয়েছে!\n\n🆔 TID: ${targetID}`,
            threadID, messageID
          );
        }

        // Remove from pending if exists
        let pendingIdx = config.APPROVAL.pendingGroups.indexOf(targetID);
        if (pendingIdx !== -1) {
          config.APPROVAL.pendingGroups.splice(pendingIdx, 1);
        }
        
        // Remove from rejected if exists
        let rejectedIdx = config.APPROVAL.rejectedGroups.indexOf(targetID);
        if (rejectedIdx !== -1) {
          config.APPROVAL.rejectedGroups.splice(rejectedIdx, 1);
        }
        
        // Approve now
        if (!config.APPROVAL.approvedGroups.includes(targetID)) {
          config.APPROVAL.approvedGroups.push(targetID);
        }
        
        // Also add to AUTO_APPROVE
        if (!config.AUTO_APPROVE) {
          config.AUTO_APPROVE = { enabled: true, approvedGroups: [], autoApproveMessage: false };
        }
        if (!config.AUTO_APPROVE.approvedGroups.includes(targetID)) {
          config.AUTO_APPROVE.approvedGroups.push(targetID);
        }
        
        // Save to PostgreSQL database first
        if (global.PostgreSQL && global.PostgreSQL.approveGroup) {
          try {
            let threadName = "Unknown Group";
            let memberCount = 0;

            // Try to get thread info
            try {
              const threadInfo = await api.getThreadInfo(targetID);
              threadName = threadInfo.threadName || threadName;
              memberCount = threadInfo.participantIDs?.length || 0;
            } catch (infoError) {
              console.log('Could not get thread info:', infoError.message);
            }

            const dbResult = await global.PostgreSQL.approveGroup(targetID, threadName, senderID, memberCount);
            if (dbResult) {
              console.log(`✅ Group ${targetID} approved in database`);
              // Sync database to config.json
              await global.PostgreSQL.syncApprovalToConfig();
            }
          } catch (dbError) {
            console.error('Database approval error:', dbError);
          }
        }

        // Save config immediately
        saveConfig(config);

        // Also update global config cache
        if (global.config) {
          global.config.APPROVAL = config.APPROVAL;
          global.config.AUTO_APPROVE = config.AUTO_APPROVE;
        }

        // Send success message to owner
        api.sendMessage(
          `✅ Group approved successfully!\n\n🆔 Thread ID: ${targetID}\n\n🚀 Bot commands এখনই active হয়ে গেছে!\n💡 Test করতে যেকোনো command try করুন`,
          threadID, messageID
        );

        // Notify the approved group if it's different from current thread
        if (targetID !== String(threadID)) {
          try {
            api.sendMessage(
              `🎉 অভিনন্দন! এই গ্রুপটি admin দ্বারা approve করা হয়েছে!\n\n` +
              `✅ এখন থেকে সব bot commands কাজ করবে।\n` +
              `📖 Command list দেখতে: ${global.config.PREFIX || '/'}help\n\n` +
              `👑 Bot Admin: ${global.config.ADMINBOT?.[0] || 'Unknown'}`,
              targetID
            );
          } catch (notifyError) {
            console.log(`Could not notify group ${targetID}: ${notifyError.message}`);
          }
        }
      }
    }
  } catch (error) {
    console.error("Approve command error:", error);
    return api.sendMessage("❌ কিছু ভুল হয়েছে! আবার চেষ্টা করুন।", threadID, messageID);
  }
};