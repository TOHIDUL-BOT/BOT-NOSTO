const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "joinNoti",
  eventType: ["log:subscribe"],
  version: "2.1.0",
  credits: "TOHIDUL (Enhanced by TOHI-BOT-HUB)",
  description: "Short stylish join notification for bot and users",
  dependencies: {
    "fs-extra": "",
    "path": ""
  }
};

module.exports.onLoad = function () {
  const gifDir = path.join(__dirname, "cache", "joinvideo", "randomgif");
  if (!fs.existsSync(gifDir)) fs.mkdirSync(gifDir, { recursive: true });
};

module.exports.run = async function ({ api, event, Users }) {
  try {
    const { threadID } = event;

    // Check if group is approved
    const configPath = path.join(__dirname, "../../config.json");
    let config = {};
    try {
      delete require.cache[require.resolve(configPath)];
      config = require(configPath);
    } catch (_) {}

    if (!config.APPROVAL) {
      config.APPROVAL = {
        approvedGroups: [],
        pendingGroups: [],
        rejectedGroups: []
      };
    }

    const isApproved = config.APPROVAL.approvedGroups.includes(String(threadID));
    if (!isApproved) return;

    // If bot is added to group
    if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
      try {
        const botname = global.config.BOTNAME || "ＴＯＨＩ-ＢＯＴ";
        const prefix = global.config.PREFIX || "/";

        // Set bot nickname
        try {
          const autoSetName = require("../commands/autosetname.js");
          await autoSetName.setBotNickname(api, threadID);
        } catch (_) {
          await api.changeNickname(`[ ${prefix} ] • ${botname}`, threadID, api.getCurrentUserID());
        }

        const botWelcomeMsg = `
╭─━━━「🤖」━━━─╮
✨ ʙᴏᴛ ᴀᴄᴛɪᴠᴀᴛᴇᴅ ✨
📌 ${prefix}ʜᴇʟᴘ ᴛᴏ ʙᴇɢɪɴ
🚩 ᴍᴀᴅᴇ ʙʏ 𝚃𝙾𝙷𝙸𝙳𝚄𝙻
╰─━━━「✅」━━━─╯`;

        const mediaPaths = [
          path.join(__dirname, "cache", "welcome.mp4"),
          path.join(__dirname, "cache", "join", "join.gif"),
          path.join(__dirname, "cache", "ullash.mp4")
        ];

        let attachment = null;
        for (const media of mediaPaths) {
          if (fs.existsSync(media)) {
            attachment = fs.createReadStream(media);
            break;
          }
        }

        return api.sendMessage({ body: botWelcomeMsg, attachment }, threadID);
      } catch (err) {
        console.error("Bot Join Error:", err);
        return api.sendMessage(`🤖 ＴＯＨＩ-ＢＯＴ যুক্ত হয়েছে!\n📌 ${global.config.PREFIX}help লিখে শুরু করুন\n🚩 TOHIDUL`, threadID);
      }
    }

    // If a user is added
    const { threadName, participantIDs } = await api.getThreadInfo(threadID);
    const threadData = global.data.threadData.get(parseInt(threadID)) || {};
    const customJoin = threadData.customJoin;

    const memJoin = event.logMessageData.addedParticipants;
    let nameArray = [], mentions = [], memberIndex = [];

    for (let i = 0; i < memJoin.length; i++) {
      const user = memJoin[i];
      nameArray.push(user.fullName);
      mentions.push({ tag: user.fullName, id: user.userFbId });
      memberIndex.push(participantIDs.length - memJoin.length + i + 1);
    }

    const userWelcome = customJoin || `
╭─🎉 𝖶𝖾𝗅𝖼𝗈𝗆𝖾 ─╮
👤 {name} 𝖩𝗈𝗂𝗇𝖾𝖽!
🏠 𝖦𝗋𝗈𝗎𝗉: {threadName}
🚩 𝖳𝖤𝖠𝖬: ＴＯＨＩ-ＢＯＴ
╰────────────╯`;

    const welcomeText = userWelcome
      .replace(/\{name}/g, nameArray.join(", "))
      .replace(/\{threadName}/g, threadName)
      .replace(/\{memberNumber}/g, memberIndex.join(", "));

    // Select random media
    const gifDir = path.join(__dirname, "cache", "joinvideo", "randomgif");
    let welcomeAttachment = null;

    if (fs.existsSync(gifDir)) {
      const files = fs.readdirSync(gifDir).filter(file => {
        const ext = path.extname(file).toLowerCase();
        return [".gif", ".mp4", ".jpg", ".png"].includes(ext);
      });

      if (files.length > 0) {
        const randomFile = files[Math.floor(Math.random() * files.length)];
        const filePath = path.join(gifDir, randomFile);
        if (fs.existsSync(filePath)) {
          welcomeAttachment = fs.createReadStream(filePath);
        }
      }
    }

    return api.sendMessage({
      body: welcomeText,
      attachment: welcomeAttachment,
      mentions
    }, threadID);

  } catch (e) {
    console.error("JoinNoti Error:", e);
  }
};
