module.exports.config = {
  name: "uptime",
  version: "5.1.0",
  permission: 0,
  usePrefix: true,
  commandCategory: "system",
  credits: "TOHI-BOT-HUB",
  aliases: ["upt", "ut", "status"]
};

module.exports.run = async ({ api, event }) => {
  const { threadID } = event;

  // Step 1: Send loading message
  const loading = await api.sendMessage("『⏳』𝐓𝐎𝐇𝐈-𝐁𝐎𝐓 𝐔𝐏𝐓𝐈𝐌𝐄 𝐋𝐎𝐀𝐃𝐈𝐍𝐆… [▓▓░░] 𝟒𝟓%", threadID);

  // Step 2: Edit to 75%
  setTimeout(() => {
    api.editMessage("『⏳』𝐓𝐎𝐇𝐈-𝐁𝐎𝐓 𝐔𝐏𝐓𝐈𝐌𝐄 𝐋𝐎𝐀𝐃𝐈𝐍𝐆… [▓▓▓▓▓░] 𝟕𝟓%", loading.messageID, threadID);
  }, 400);

  // Step 3: Edit to 100%
  setTimeout(() => {
    api.editMessage("『⏳』𝐓𝐎𝐇𝐈-𝐁𝐎𝐓 𝐔𝐏𝐓𝐈𝐌𝐄 𝐋𝐎𝐀𝐃𝐈𝐍𝐆… [▓▓▓▓▓▓▓▓] 𝟏𝟎𝟎%", loading.messageID, threadID);
  }, 700);

  // Step 4: Edit to final status
  setTimeout(() => {
    const processUptime = process.uptime();
    const days = Math.floor(processUptime / 86400);
    const hours = Math.floor((processUptime % 86400) / 3600);
    const minutes = Math.floor((processUptime % 3600) / 60);
    const seconds = Math.floor(processUptime % 60);

    const moment = require("moment-timezone");
    const timeNow = moment.tz("Asia/Dhaka").format("DD/MM/YYYY | HH:mm:ss");
    const { commands } = global.client;
    const prefix = global.config.PREFIX || '.';
    const botName = global.config.BOTNAME || "ＴＯＨＩ-ＢＯＴ";
    const botAdmin = (global.config.ADMINBOT && Array.isArray(global.config.ADMINBOT)) ? global.config.ADMINBOT.length : 0;
    const botVersion = "𝟱.𝟭.𝟬";
    const allUserIDs = global.data.allUserID || [];
    const allThreadIDs = global.data.allThreadID || [];

    // Custom System Info
    const cpu = "💎 𝗜𝗻𝘁𝗲𝗹 𝗖𝗼𝗿𝗲 𝗶𝟵 𝟭𝟮𝘁𝗵 𝗚𝗲𝗻";
    const totalRAM = "32 𝗚𝗕";
    const usedRAM = "5.62 𝗚𝗕";
    const upmsg = [
      days > 0 ? `🗓️ ${days}𝗱` : null,
      hours > 0 ? `⏰ ${hours}𝗵` : null,
      minutes > 0 ? `⏲️ ${minutes}𝗺` : null,
      `⏱️ ${seconds}𝘀`
    ].filter(Boolean).join(" ");

    let msg =
`╔═════════════════════╗
      『🚀 𝐓𝐎𝐇𝐈-𝐁𝐎𝐓 𝐔𝐏𝐓𝐈𝐌𝐄 🚀』
╚═════════════════════╝
🟢 𝙎𝙩𝙖𝙩𝙪𝙨   : 𝗢𝗡𝗟𝗜𝗡𝗘
🤖 𝐁𝐨𝐭      : ${botName}
🆙 𝐕𝐞𝐫𝐬𝐢𝐨𝐧   : ${botVersion}
👑 𝐀𝐝𝐦𝐢𝐧𝐬    : ${botAdmin}
📂 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬  : ${commands.size}
👥 𝐔𝐬𝐞𝐫𝐬     : ${allUserIDs.length}
💬 𝐓𝐡𝐫𝐞𝐚𝐝𝐬   : ${allThreadIDs.length}
⏱️ 𝐔𝐩𝐭𝐢𝐦𝐞   : ${upmsg}
📅 𝐃𝐚𝐭𝐞      : ${timeNow}
🧠 𝐂𝐏𝐔      : ${cpu}
💾 𝐑𝐀𝐌      : ${usedRAM} / ${totalRAM}
🌐 𝐏𝐢𝐧𝐠     : ${Date.now() - event.timestamp}𝗺𝘀
🔑 𝐏𝐫𝐞𝐟𝐢𝐱   : ${prefix}
═══════════════════════
『✨ 𝑪𝒓𝒆𝒅𝒊𝒕: 𝐓𝐎𝐇𝐈-𝐁𝐎𝐓-𝐇𝐔𝐁 ✨』
`;

    api.editMessage(msg, loading.messageID, threadID);
  }, 1000);
};