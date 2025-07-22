module.exports.config = {
  name: "antiout",
  version: "2.0.0",
  hasPermssion: 1,
  usePrefix: true,
  credits: "TOHI-BOT-HUB",
  description: "🛡️ Anti-Out system - Automatically re-add users who leave the group",
  commandCategory: "GC ADMIN",
  usages: "[on/off/status]",
  cooldowns: 3,
  dependencies: {
    "fs-extra": ""
  }
};

const fs = require('fs-extra');
const OWNER_ID = "100092006324917"; // Your UID here

function stylishText(text, style = "default") {
  const styles = {
    default: `✨ ${text} ✨`,
    title: `🎭 ${text} 🎭`,
    subtitle: `🌟 ${text} 🌟`,
    warning: `⚠️ ${text} ⚠️`,
    success: `✅ ${text} ✅`,
    error: `❌ ${text} ❌`,
    bangla: `🇧🇩 ${text} 🇧🇩`,
    love: `💖 ${text} 💖`,
    fire: `🔥 ${text} 🔥`,
    boss: `👑 ${text} 👑`,
    antiout: `🛡️ ${text} 🛡️`
  };
  return styles[style] || styles.default;
}

module.exports.run = async function({ api, event, args, Threads }) {
  const { threadID, senderID } = event;

  // OWNER ONLY GUARD
  if (senderID !== OWNER_ID) {
    return api.sendMessage(
      `${stylishText("Access Denied!", "error")}\n\n❌ শুধুমাত্র মালিক (${OWNER_ID}) এই কমান্ড ব্যবহার করতে পারবেন!`,
      threadID
    );
  }

  const input = args[0] ? args[0].toLowerCase() : "status";
  try {
    const info = await api.getThreadInfo(threadID);
    const data = (await Threads.getData(threadID)).data || {};
    const currentTime = new Date().toLocaleTimeString("bn-BD", { timeZone: "Asia/Dhaka", hour12: false });

    switch (input) {
      case "on":
        data["antiout"] = true;
        await Threads.setData(threadID, { data });
        global.data.threadData.set(parseInt(threadID), data);

        return api.sendMessage(
          `🛡️ 𝗔𝗡𝗧𝗜-𝗢𝗨𝗧: ${stylishText("চালু", "success")}
🔒 কেউ বের হলে আবার এড হবে।
🤖 ${stylishText("বট এডমিন হলে ১০০% কাজ করবে!", "warning")}
⏰ ${currentTime}`,
          threadID
        );
      case "off":
        data["antiout"] = false;
        await Threads.setData(threadID, { data });
        global.data.threadData.set(parseInt(threadID), data);

        return api.sendMessage(
          `🔓 𝗔𝗡𝗧𝗜-𝗢𝗨𝗧: ${stylishText("বন্ধ", "error")}
🚪 কেউ চাইলে group ছাড়তে পারবে।
⏰ ${currentTime}`,
          threadID
        );
      case "status":
      default:
        const isAntiOutEnabled = data.antiout === true;
        const isBotAdmin2 = info.adminIDs.some(item => item.id == api.getCurrentUserID());
        return api.sendMessage(
          `🛡️ 𝗔𝗡𝗧𝗜-𝗢𝗨𝗧 𝗦𝗧𝗔𝗧𝗨𝗦
স্ট্যাটাস: ${isAntiOutEnabled ? stylishText("চালু", "success") : stylishText("বন্ধ", "error")}
বট এডমিন: ${isBotAdmin2 ? stylishText("হ্যাঁ", "success") : stylishText("না", "warning")}
ID: ${threadID}
⏰ ${currentTime}
\n/antiout on | off | status`,
          threadID
        );
    }
  } catch (error) {
    console.error('[ANTIOUT] Command error:', error);
    return api.sendMessage(
      `${stylishText("System Error!", "error")}\n❌ সমস্যা হয়েছে: ${error.message}`,
      threadID
    );
  }
};