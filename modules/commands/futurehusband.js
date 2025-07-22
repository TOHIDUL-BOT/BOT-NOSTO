
/**
* @author TOHI-BOT-HUB
*/

module.exports.config = {
  name: "futurehusband", 
  aliases:[ "fth", "ftrh", "futurehb"] ,
  version: "1.0.0", 
  permission: 0,
  credits: "TOHI-BOT-HUB",
  description: "Find your future husband in the group and create romantic image",
  usePrefix: true,
  commandCategory: "LOVE", 
  usages: "futurehusband", 
  cooldowns: 10,
  dependencies: {
        "axios": "",
        "fs-extra": "",
        "path": "",
        "jimp": ""
  }
};

module.exports.onLoad = async () => {
  const { resolve } = global.nodemodule["path"];
  const { existsSync, mkdirSync } = global.nodemodule["fs-extra"];
  const { downloadFile } = global.utils;
  const cachePath = __dirname + "/cache/";
  const imgPath = resolve(__dirname, "cache", "futurehusband_bg.png");
  
  if (!existsSync(cachePath + "")) mkdirSync(cachePath, { recursive: true });
  if (!existsSync(imgPath)) await downloadFile("https://i.postimg.cc/bJhHSrNq/3caab0ce1121c2da6707bb93779581f9.jpg", imgPath);
};

// Get random male from group
async function getRandomMale(api, threadID, senderID, Users) {
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const participantIDs = threadInfo.participantIDs.filter(id => id !== senderID);
    
    if (participantIDs.length === 0) return null;
    
    // Get user info for all participants
    const userInfos = await api.getUserInfo(participantIDs);
    
    // Filter males
    const males = Object.keys(userInfos).filter(uid => {
      const user = userInfos[uid];
      return user.gender === "MALE" && !user.isBot;
    });
    
    let selectedID;
    if (males.length === 0) {
      // If no males found, pick random user
      selectedID = participantIDs[Math.floor(Math.random() * participantIDs.length)];
    } else {
      selectedID = males[Math.floor(Math.random() * males.length)];
    }
    
    // Try multiple methods to get the user's name
    let userName = "Unknown";
    
    try {
      // Method 1: From getUserInfo
      if (userInfos[selectedID]?.name && userInfos[selectedID].name !== "Facebook User") {
        userName = userInfos[selectedID].name;
      } else {
        // Method 2: From Users database
        const userData = await Users.getData(selectedID);
        if (userData && userData.name && userData.name !== "undefined") {
          userName = userData.name;
        } else {
          // Method 3: From Users.getNameUser
          try {
            const nameFromDB = await Users.getNameUser(selectedID);
            if (nameFromDB && nameFromDB !== "undefined" && !nameFromDB.startsWith("User-")) {
              userName = nameFromDB;
            }
          } catch (e) {
            console.log("Could not get name from Users:", e.message);
          }
        }
      }
    } catch (nameError) {
      console.log("Error getting user name:", nameError.message);
    }
    
    return {
      id: selectedID,
      name: userName
    };
  } catch (error) {
    console.error("Error getting random male:", error);
    return null;
  }
}

async function makeHusbandImage({ wife, husband }) {
  const fs = require("fs-extra");
  const path = require("path");
  const axios = require("axios");
  const Jimp = require("jimp");
  const cachePath = path.resolve(__dirname, "cache");

  try {
    let backgroundImg;
    const bgPath = cachePath + "/futurehusband_bg.png";
    
    if (fs.existsSync(bgPath)) {
      backgroundImg = await Jimp.read(bgPath);
    } else {
      // Create a beautiful gradient background
      backgroundImg = new Jimp(800, 600, '#87CEEB');
      const gradient = backgroundImg.clone();
      gradient.color([{ apply: 'hue', params: [45] }]);
      backgroundImg = backgroundImg.composite(gradient, 0, 0, { mode: Jimp.BLEND_OVERLAY, opacitySource: 0.5 });
    }
    
    let outputPath = cachePath + `/futurehusband_${wife}_${husband}.png`;
    let wifeAvatarPath = cachePath + `/wife_${wife}.png`;
    let husbandAvatarPath = cachePath + `/husband_${husband}.png`;
    
    // Download avatars
    let wifeData = (await axios.get(`https://graph.facebook.com/${wife}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(wifeAvatarPath, Buffer.from(wifeData));
    
    let husbandData = (await axios.get(`https://graph.facebook.com/${husband}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(husbandAvatarPath, Buffer.from(husbandData));
    
    // Create circular avatars
    let wifeCircle = await Jimp.read(await circle(wifeAvatarPath));
    let husbandCircle = await Jimp.read(await circle(husbandAvatarPath));
    
    // Resize background and add avatars
    backgroundImg.resize(800, 450);
    
    // Add heart in the middle
    const heartEmoji = await Jimp.read(await createHeart());
    
    // Position avatars and heart
    backgroundImg
      .composite(wifeCircle.resize(217, 217), 95, 95)
      .composite(husbandCircle.resize(210, 210), 484, 103.5)
      .composite(heartEmoji.resize(80, 80), 360, 240);
    
    // Add text
    if (Jimp.FONT_SANS_32_BLACK) {
      const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
      backgroundImg.print(font, 250, 50, {
        text: "FUTURE COUPLE",
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
      }, 300, 100);
    }
    
    let buffer = await backgroundImg.getBufferAsync("image/png");
    fs.writeFileSync(outputPath, buffer);
    
    // Cleanup
    if (fs.existsSync(wifeAvatarPath)) fs.unlinkSync(wifeAvatarPath);
    if (fs.existsSync(husbandAvatarPath)) fs.unlinkSync(husbandAvatarPath);
    
    return outputPath;
  } catch (error) {
    console.error("Error creating husband image:", error);
    throw error;
  }
}

async function circle(imagePath) {
  const Jimp = require("jimp");
  const image = await Jimp.read(imagePath);
  image.circle();
  return await image.getBufferAsync("image/png");
}

async function createHeart() {
  const Jimp = require("jimp");
  // Create a simple heart shape using blue color
  const heart = new Jimp(80, 80, '#4169E1');
  heart.circle();
  return await heart.getBufferAsync("image/png");
}

module.exports.run = async function({ event, api, args, Users }) {
  const fs = require("fs-extra");
  const { threadID, messageID, senderID } = event;
  
  try {
    // Send processing message
    const processingMsg = await api.sendMessage("💙 খুঁজে দেখি তোমার ভবিষ্যৎ স্বামী কে হতে পারে... 💙", threadID);
    
    // Get sender info
    const senderInfo = await Users.getData(senderID);
    const senderName = senderInfo.name || "Unknown";
    
    // Find random male from group
    const futureHusband = await getRandomMale(api, threadID, senderID, Users);
    
    if (!futureHusband) {
      api.unsendMessage(processingMsg.messageID);
      return api.sendMessage("❌ গ্রুপে কোনো ছেলে খুঁজে পাওয়া যায়নি!", threadID, messageID);
    }
    
    // Create the image
    const imagePath = await makeHusbandImage({ 
      wife: senderID, 
      husband: futureHusband.id 
    });
    
    // Romantic messages in Bengali
    const romanticMessages = [
      `💙 আহা! ${senderName} এর ভবিষ্যৎ স্বামী হবে ${futureHusband.name}! 💙\n\n💌 "তুমি আমার হৃদয়ের রাজা, আমার স্বপ্নের রাজপুত্র। তোমার সাথেই আমার জীবন সার্থক হবে।" 💌\n\n💖 শুভকামনা রইলো তোমাদের ভবিষ্যতের জন্য! 💖`,
      
      `💙 বাহ! ${senderName} আর ${futureHusband.name} এর জুটি দেখতে খুবই চমৎকার! 💙\n\n💌 "ভালোবাসা মানে শুধু তোমাকেই পাওয়া। তুমি আমার জীবনের একমাত্র আশা।" 💌\n\n🌹 তোমাদের প্রেমের গল্প হোক অনন্ত! 🌹`,
      
      `💙 দুর্দান্ত! ${senderName} এর জীবনসঙ্গী হবে ${futureHusband.name}! 💙\n\n💌 "তোমার ভালোবাসায়ই আমার সকাল, তোমার স্নেহেই আমার রাত। তুমিই আমার সব।" 💌\n\n💝 তোমাদের ভালোবাসা হোক চিরস্থায়ী! 💝`,
      
      `💙 অসাধারণ! ${senderName} আর ${futureHusband.name} এর মধ্যে নিখুঁত ম্যাচ! 💙\n\n💌 "প্রেম মানে একসাথে থাকা। তুমি আমার হৃদয়ের একমাত্র সম্রাট।" 💌\n\n🎉 তোমাদের সুখী বিবাহিত জীবনের শুভেচ্ছা! 🎉`
    ];
    
    const randomMessage = romanticMessages[Math.floor(Math.random() * romanticMessages.length)];
    
    // Remove processing message
    api.unsendMessage(processingMsg.messageID);
    
    // Send result
    api.sendMessage({
      body: randomMessage,
      mentions: [
        { tag: senderName, id: senderID },
        { tag: futureHusband.name, id: futureHusband.id }
      ],
      attachment: fs.createReadStream(imagePath)
    }, threadID, () => {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }, messageID);
    
  } catch (error) {
    console.error("Future husband command error:", error);
    api.sendMessage("❌ দুঃখিত, ভবিষ্যৎ স্বামী খুঁজতে কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন!", threadID, messageID);
  }
};
