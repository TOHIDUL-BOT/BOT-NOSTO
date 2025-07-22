const fs = require("fs-extra");
const moment = require("moment-timezone");
const axios = require("axios");
const path = require("path");

module.exports.config = {
  name: "admin",
  version: "2.2.4",
  hasPermssion: 0,
  usePrefix: true,
  credits: "TOHI-BOT-HUB",
  description: "Show Bot Owner Info",
  commandCategory: "info",
  usages: "",
  cooldowns: 5
};

const smallCaps = (str = "") => str
  .replace(/[A-Za-z]/g, c =>
    ({
      A: "ᴀ", B: "ʙ", C: "ᴄ", D: "ᴅ", E: "ᴇ", F: "ꜰ", G: "ɢ", H: "ʜ", I: "ɪ", J: "ᴊ", K: "ᴋ", L: "ʟ", M: "ᴍ",
      N: "ɴ", O: "ᴏ", P: "ᴘ", Q: "ǫ", R: "ʀ", S: "s", T: "ᴛ", U: "ᴜ", V: "ᴠ", W: "ᴡ", X: "x", Y: "ʏ", Z: "ᴢ",
      a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ", i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ",
      n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ", s: "s", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ"
    }[c] || c)
  );

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  const now = moment().tz("Asia/Dhaka").format("DD/MM/YYYY hh:mm:ss A");
  const imageUrl = "https://i.postimg.cc/nhM2PPjW/admin.png";
  const imagePath = path.join(__dirname, "cache", `admin_${Date.now()}.png`);

  // Links (NO font, NO smallCaps)
  const telegramURL = "https://t.me/NFTTOHIDUL19";
  const facebookURL = "https://www.facebook.com/profile.php?id=100092006324917";

  // Build message
  let ownerInfo =
    smallCaps("╭───〔👑BOT OWNER INFO👑〕───╮") + "\n" +
    smallCaps("┃") + "\n" +
    smallCaps("┃ 🏷️ Name       : T O H I D U L ッ") + "\n" +
    smallCaps("┃ 👨‍💼 Gender     : Male") + "\n" +
    smallCaps("┃ 💖 Relation   : Single") + "\n" +
    smallCaps("┃ 🎂 Age         : 18+") + "\n" +
    smallCaps("┃ 🕌 Religion    : Islam") + "\n" +
    smallCaps("┃ 🎓 Education  : Inter 1st Year") + "\n" +
    smallCaps("┃ 🏠 Address    : Thakurgaon, Bangladesh") + "\n" +
    smallCaps("┃") + "\n" +
    smallCaps("┣━━━〔 🌐 SOCIAL LINKS 〕━━━┫") + "\n" +
    smallCaps("┃ 🎭 TikTok    : -----------") + "\n" +
    "┃ ✈️ Telegram  : " + telegramURL + "\n" + // <-- NO font here, just plain text!
    "┃ 🌍 Facebook  : " + facebookURL + "\n" + // <-- NO font here, just plain text!
    smallCaps("┃") + "\n" +
    smallCaps("┣━━━〔 ⏰ UPDATED TIME 〕━━━┫") + "\n" +
    smallCaps(`┃ 🕒 ${now}`) + "\n" +
    smallCaps("╰───────────────────────────╯") + "\n" +
    smallCaps("💌 Created by TOHIDUL BOT");

  let loadingMsg;
  try {
    loadingMsg = await api.sendMessage(
      smallCaps("⏳ Loading Owner Info...\n\n[▓▓░░░░░░░░░░] 45%"),
      threadID
    );
    setTimeout(() => {
      api.editMessage(
        smallCaps("⏳ Loading Owner Info...\n\n[▓▓▓▓▓▓░░░░░░] 75%"),
        loadingMsg.messageID,
        threadID
      );
    }, 100);
    setTimeout(() => {
      api.editMessage(
        smallCaps("⏳ Loading Owner Info...\n\n[▓▓▓▓▓▓▓▓▓▓▓░] 95%"),
        loadingMsg.messageID,
        threadID
      );
    }, 200);

    setTimeout(async () => {
      try {
        await api.editMessage(
          smallCaps("⏳ Loading Owner Info...\n\n[▓▓▓▓▓▓▓▓▓▓▓▓] 100%"),
          loadingMsg.messageID,
          threadID
        );
        // Download image
        const response = await axios({
          url: imageUrl,
          method: 'GET',
          responseType: 'stream',
          timeout: 10000
        });
        const cacheDir = path.dirname(imagePath);
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        const writer = fs.createWriteStream(imagePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        await api.unsendMessage(loadingMsg.messageID);

        await api.sendMessage({
          body: ownerInfo,
          attachment: fs.createReadStream(imagePath),
        }, threadID, () => {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        });

      } catch (error) {
        await api.unsendMessage(loadingMsg.messageID);
        await api.sendMessage(ownerInfo + "\n\n[⛔] 𝖈𝖍𝖔𝖇𝖎 𝖉𝖔𝖜𝖓𝖑𝖔𝖆𝖉 𝖘𝖒𝖘𝖞𝖆!", threadID, messageID);
      }
    }, 350);

  } catch (error) {
    await api.sendMessage(ownerInfo + "\n\n[⛔] 𝖑𝖔𝖆𝖉𝖎𝖓𝖌 𝖊 𝖘𝖒𝖘𝖞𝖆!", threadID, messageID);
  }
};