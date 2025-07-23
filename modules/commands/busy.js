module.exports.config = {
  name: "busy",
  version: "1.0.3",
  hasPermssion: 0,
  credits: "TOHI-BOT-HUB (fixed by Copilot)",
  description: "Set busy mode to auto-reply when mentioned",
  commandCategory: "USER",
  usages: "[reason] or off",
  cooldowns: 3,
  usePrefix: true
};

module.exports.run = async function({ api, event, args, Users }) {
  const { senderID, threadID, messageID } = event;
  const PostgreSQL = require('../../includes/database/postgresql')();

  try {
    if (args[0] && args[0].toLowerCase() === "off") {
      await Users.setData(senderID, { busy: false });

      // Update PostgreSQL
      if (process.env.DATABASE_URL) {
        await PostgreSQL.updateUser(senderID, { busy: false });
      }

      return api.sendMessage("✅ Busy Mode বন্ধ হয়েছে", threadID, messageID);
    }
    const reason = args.join(" ");
    const busyData = reason || true;
    await Users.setData(senderID, { busy: busyData });

    // Update PostgreSQL
    if (process.env.DATABASE_URL) {
      await PostgreSQL.updateUser(senderID, { busy: busyData });
    }

    let userName = "";
    try {
      const userInfo = await api.getUserInfo(senderID);
      if (userInfo && userInfo[senderID] && userInfo[senderID].name) {
        userName = userInfo[senderID].name;
      }
    } catch {}
    if (!userName) userName = `User-${senderID.slice(-6)}`;

    const successMessage = reason ? 
      `✅ Busy Mode চালু হয়েছে\n📝 কারণ: ${reason}\n🔓 বন্ধ করতে: /busy off`
      : `✅ Busy Mode চালু হয়েছে\n🔓 বন্ধ করতে: /busy off`;

    return api.sendMessage(successMessage, threadID, messageID);

  } catch (error) {
    console.error("Busy command error:", error);
    return api.sendMessage("❌ Error setting busy mode", threadID, messageID);
  }
};

module.exports.handleEvent = async function({ api, event, Users }) {
  const { type, threadID, mentions } = event;
  if (type !== "message" && type !== "message_reply") return;

  const PostgreSQL = require('../../includes/database/postgresql')();

  // যদি কেউ mention করে, তখন চেক করবে  
  if (mentions && Object.keys(mentions).length > 0) {
    for (const userID of Object.keys(mentions)) {
      try {
        let userData = await Users.getData(userID);

        // Also check PostgreSQL for busy status
        if (process.env.DATABASE_URL) {
          const pgUser = await PostgreSQL.getUser(userID);
          if (pgUser && pgUser.busy && !userData?.busy) {
            userData = { ...userData, busy: pgUser.busy };
          }
        }

        if (userData && userData.busy) {
          // Full name বের করো (uid না)
          let userName = "";
          try {
            const userInfo = await api.getUserInfo(userID);
            if (userInfo && userInfo[userID] && userInfo[userID].name) {
              userName = userInfo[userID].name;
            }
          } catch {}
          if (!userName) userName = `User-${userID.slice(-6)}`;

          const busyReason = typeof userData.busy === "string" ? userData.busy : "Busy";
          const busyMessage = `🔴 ${userName} এখন Busy আছে\n📝 কারণ: ${busyReason}`;
          api.sendMessage(busyMessage, threadID);
        }
      } catch {}
    }
  }
};