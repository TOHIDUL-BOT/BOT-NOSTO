const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports.config = {
  name: "coupledp",
  aliases: ["cdp", "cpldp", "couple"],
  version: "8.0.1",
  credits: "TOHI-BOT-HUB (fixed by Copilot)",
  cooldowns: 0,
  hasPermssion: 0,
  description: "Fetch a random couple DP (male & female)",
  commandCategory: "LOVE",
  category: "image",
  usePrefix: true,
  prefix: true
};

async function downloadImage(url, filePath) {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
    timeout: 10000
  });
  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
  return fs.createReadStream(filePath);
}

module.exports.run = async function ({ api, event }) {
  try {
    const apiBase = await baseApiUrl();
    const response = await axios.get(`${apiBase}/api/cdp2`, {
      headers: {
        "author": "MahMUD"
      }
    });

    if (response.data.error)
      return api.sendMessage(response.data.error, event.threadID, event.messageID);

    const { male, female } = response.data;
    if (!male || !female)
      return api.sendMessage("Couldn't fetch couple DP. Try again later.", event.threadID, event.messageID);

    // Prepare cache folder
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    const malePath = path.join(cacheDir, `cdp_male_${Date.now()}.jpg`);
    const femalePath = path.join(cacheDir, `cdp_female_${Date.now()}.jpg`);

    let attachments = [];

    try {
      const maleImg = await downloadImage(male, malePath);
      const femaleImg = await downloadImage(female, femalePath);

      if (maleImg) attachments.push(maleImg);
      if (femaleImg) attachments.push(femaleImg);

      if (attachments.length === 0) {
        return api.sendMessage("❌ Failed to download couple images. Please try again.", event.threadID, event.messageID);
      }
    } catch (downloadError) {
      console.error("Download error:", downloadError);
      return api.sendMessage("❌ Error downloading images. Please try again later.", event.threadID, event.messageID);
    }

    await api.sendMessage({
      body: "Here is your couple DP BbZ 🥰",
      attachment: attachments
    }, event.threadID, event.messageID);

    // Clean up cache files after sending
    setTimeout(() => {
      try { if (fs.existsSync(malePath)) fs.unlinkSync(malePath); } catch {}
      try { if (fs.existsSync(femalePath)) fs.unlinkSync(femalePath); } catch {}
    }, 30 * 1000);

  } catch (err) {
    console.error(err);
    api.sendMessage("Error fetching couple DP. Please try again later.", event.threadID, event.messageID);
  }
};