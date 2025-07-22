
module.exports.config = {
  name: "imagine",
  aliases: ["mj","imgn"],
  version: "1.0.0",
  hasPermssion: 0,
  credits: "TOHI-BOT-HUB",
  description: "Generate AI images from text prompts",
  usePrefix: true,
  commandCategory: "ai",
  usages: "imagine [prompt]",
  cooldowns: 10
};

module.exports.run = async function({ api, event, args }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  
  const prompt = args.join(" ");
  
  if (!prompt) {
    return api.sendMessage("⚠️ Please provide a prompt!\n\nUsage: /imagine cat playing with yarn", event.threadID, event.messageID);
  }

  try {
    // Send loading message
    const loadingMsg = await api.sendMessage("🎨 Generating your image, please wait...", event.threadID);
    
    // Get API data
    const apis = await axios.get('https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json');
    const apiUrl = apis.data.api;
    
    // Generate image
    const res = await axios.get(`${apiUrl}/nayan/img?prompt=${encodeURIComponent(prompt)}`);
    
    if (!res.data || !res.data.imageUrls || res.data.imageUrls.length === 0) {
      api.unsendMessage(loadingMsg.messageID);
      return api.sendMessage("❌ Failed to generate image. Please try again with a different prompt.", event.threadID, event.messageID);
    }
    
    const data = res.data.imageUrls;
    const numberSearch = data.length;
    var num = 0;
    var imgData = [];
    
    // Download and prepare images
    for (var i = 0; i < parseInt(numberSearch); i++) {
      let path = __dirname + `/cache/${num += 1}.jpg`;
      let getDown = (await axios.get(`${data[i]}`, { responseType: 'arraybuffer' })).data;
      fs.writeFileSync(path, Buffer.from(getDown, 'utf-8'));
      
      // Convert buffer to readable stream
      const { Readable } = require('stream');
      const imgStream = new Readable();
      imgStream.push(fs.readFileSync(path));
      imgStream.push(null);
      
      imgData.push(imgStream);
    }

    // Unsend loading message
    api.unsendMessage(loadingMsg.messageID);
    
    // Send result
    api.sendMessage({
      attachment: imgData,
      body: `🔍 Imagine Result 🔍\n\n📝 Prompt: ${prompt}\n\n#️⃣ Number of Images: ${numberSearch}`
    }, event.threadID, event.messageID);
    
    // Clean up cache files
    for (let ii = 1; ii <= parseInt(numberSearch); ii++) {
      try {
        fs.unlinkSync(__dirname + `/cache/${ii}.jpg`);
      } catch (error) {
        console.log(`Could not delete cache file ${ii}.jpg`);
      }
    }
    
  } catch (error) {
    console.error("Imagine command error:", error);
    api.sendMessage("❌ An error occurred while generating the image. Please try again later.", event.threadID, event.messageID);
  }
};
