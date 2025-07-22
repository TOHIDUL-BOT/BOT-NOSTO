
module.exports.config = {
  name: "genimage",
  version: "1.0.1",
  hasPermssion: 0,
  usePrefix: true,
  credits: "TOHI-BOT-HUB",
  description: "Generate AI images",
  commandCategory: "IMAGE",
  usages: "[text prompt]",
  cooldowns: 2,
};

module.exports.run = async ({api, event, args }) => {
  const axios = require('axios');
  const fs = require('fs-extra');
  let { threadID, messageID } = event;
  let query = args.join(" ");
  
  if (!query) {
    return api.sendMessage("🎨 Please provide a text prompt!\nExample: /genimage beautiful sunset over mountains", threadID, messageID);
  }

  try {
    // Send processing message
    const processingMsg = await api.sendMessage("🎨 Generating your image, please wait...", threadID);
    
    let path = __dirname + `/cache/generated_${Date.now()}.png`;
    
    const response = await axios.get(`https://image.pollinations.ai/prompt/${encodeURIComponent(query)}`, {
      responseType: "arraybuffer",
      timeout: 30000
    });
    
    fs.writeFileSync(path, Buffer.from(response.data));
    
    // Remove processing message
    api.unsendMessage(processingMsg.messageID);
    
    api.sendMessage({
      body: `✅ Here's your generated image!\n\n📝 Prompt: ${query}`,
      attachment: fs.createReadStream(path)
    }, threadID, () => {
      // Clean up file after sending
      try {
        fs.unlinkSync(path);
      } catch (err) {
        console.log("Could not delete temp file:", err.message);
      }
    }, messageID);
    
  } catch (error) {
    console.error("Image generation error:", error.message);
    api.sendMessage("❌ Failed to generate image. Please try again with a different prompt!", threadID, messageID);
  }
};
