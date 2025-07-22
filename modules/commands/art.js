const axios = require('axios');
const fs = require("fs-extra");
const path = require("path");

const getBaseApiUrl = async () => {
  try {
    const res = await axios.get(
      "https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json"
    );
    return res.data.api;
  } catch {
    return null;
  }
};

module.exports = {
  config: {
    name: "art",
    version: "1.7.1",
    credits: "Nazrul (fixed by Copilot & ChatGPT)",
    hasPermssion: 0,
    description: "{pn} - Enhance your photos with artful transformations!",
    prefix: true,
    usePrefix: true,
    commandCategory: "art",
    cooldowns: 5,
    usages: "{pn} reply to an image or provide image URL"
  },
  run: async function({ message, event, args, api }) {
    try {
      const cp = ["bal","zombie","anime","ghost", "watercolor", "sketch", "abstract", "cartoon","monster"];
      const prompt = args[0] || cp[Math.floor(Math.random() * cp.length)];

      // Notify user
      const loadingMsg = await api.sendMessage("🎨 Processing your image, please wait...", event.threadID);

      // Get photo URL from reply or args
      let photoUrl = "";
      if (event.type === "message_reply" && event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
        photoUrl = event.messageReply.attachments[0].url;
      } else if (args.length > 0) {
        photoUrl = args.join(' ');
      }

      if (!photoUrl) {
        await api.sendMessage("🔰 Please reply to an image or provide a valid image URL!", event.threadID, event.messageID);
        await api.unsendMessage(loadingMsg.messageID);
        return;
      }

      // Get API base URL
      const apiBase = await getBaseApiUrl();
      if (!apiBase) {
        await api.sendMessage("❌ Could not fetch base API URL. Try again later.", event.threadID, event.messageID);
        await api.unsendMessage(loadingMsg.messageID);
        return;
      }

      // Call Art API
      let response;
      try {
        response = await axios.get(`${apiBase}/art2`, {
          params: {
            url: photoUrl,
            prompt: prompt
          },
          timeout: 15000
        });
      } catch (err) {
        await api.sendMessage("❌ Could not connect to art API. Try again later.", event.threadID, event.messageID);
        await api.unsendMessage(loadingMsg.messageID);
        return;
      }

      // Check if valid image URL exists
      if (!response.data || !response.data.imageUrl) {
        await api.sendMessage("⚠ Failed to get a valid image URL. Please try again.", event.threadID, event.messageID);
        await api.unsendMessage(loadingMsg.messageID);
        return;
      }

      const imageUrl = response.data.imageUrl;

      // Prepare cache directory
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      const filePath = path.join(cacheDir, `art_${Date.now()}.jpg`);

      try {
        // Download image
        const imgRes = await axios.get(imageUrl, { responseType: "stream", timeout: 15000 });
        await new Promise((resolve, reject) => {
          const writer = fs.createWriteStream(filePath);
          imgRes.data.pipe(writer);
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        // Remove loading message
        await api.unsendMessage(loadingMsg.messageID);

        // Send image
        await api.sendMessage({
          body: `Here's your artful image! 🎨`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, event.messageID);

        // Delete cached file after 20 seconds
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch (e) {
            // ignore error
          }
        }, 20 * 1000);

      } catch (downloadErr) {
        await api.sendMessage("❌ Error downloading art image. Please try again.", event.threadID, event.messageID);
        await api.unsendMessage(loadingMsg.messageID);
      }

    } catch (error) {
      await api.sendMessage(`Error: ${error.message}`, event.threadID, event.messageID);
    }
  }
};
