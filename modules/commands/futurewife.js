
/**
* @author TOHI-BOT-HUB
*/

module.exports.config = {
  name: "futurewife", 
  aliases: [ "ftw", "ftrw", "futurewf" ],
  version: "1.0.0", 
  permission: 0,
  credits: "TOHI-BOT-HUB",
  description: "Find your future wife in the group and create romantic image",
  usePrefix: true,
  commandCategory: "LOVE", 
  usages: "futurewife", 
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
  const imgPath = resolve(__dirname, "cache", "futurewife_bg.png");
  
  if (!existsSync(cachePath + "")) mkdirSync(cachePath, { recursive: true });
  if (!existsSync(imgPath)) await downloadFile("https://i.postimg.cc/bJhHSrNq/3caab0ce1121c2da6707bb93779581f9.jpg", imgPath);
};

// Get random female from group
async function getRandomFemale(api, threadID, senderID, Users) {
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const participantIDs = threadInfo.participantIDs.filter(id => id !== senderID);
    
    if (participantIDs.length === 0) return null;
    
    // Get user info for all participants
    const userInfos = await api.getUserInfo(participantIDs);
    
    // Filter females
    const females = Object.keys(userInfos).filter(uid => {
      const user = userInfos[uid];
      return user.gender === "FEMALE" && !user.isBot;
    });
    
    let selectedID;
    if (females.length === 0) {
      // If no females found, pick random user
      selectedID = participantIDs[Math.floor(Math.random() * participantIDs.length)];
    } else {
      selectedID = females[Math.floor(Math.random() * females.length)];
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
    console.error("Error getting random female:", error);
    return null;
  }
}

async function makeWifeImage({ husband, wife }) {
  const fs = require("fs-extra");
  const path = require("path");
  const axios = require("axios");
  const Jimp = require("jimp");
  const cachePath = path.resolve(__dirname, "cache");

  try {
    let backgroundImg;
    const bgPath = cachePath + "/futurewife_bg.png";
    
    if (fs.existsSync(bgPath)) {
      backgroundImg = await Jimp.read(bgPath);
    } else {
      // Create a beautiful gradient background
      backgroundImg = new Jimp(800, 600, '#ff9a9e');
      const gradient = backgroundImg.clone();
      gradient.color([{ apply: 'hue', params: [45] }]);
      backgroundImg = backgroundImg.composite(gradient, 0, 0, { mode: Jimp.BLEND_OVERLAY, opacitySource: 0.5 });
    }
    
    let outputPath = cachePath + `/futurewife_${husband}_${wife}.png`;
    let husbandAvatarPath = cachePath + `/husband_${husband}.png`;
    let wifeAvatarPath = cachePath + `/wife_${wife}.png`;
    
    // Download avatars
    let husbandData = (await axios.get(`https://graph.facebook.com/${husband}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(husbandAvatarPath, Buffer.from(husbandData));
    
    let wifeData = (await axios.get(`https://graph.facebook.com/${wife}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(wifeAvatarPath, Buffer.from(wifeData));
    
    // Create circular avatars
    let husbandCircle = await Jimp.read(await circle(husbandAvatarPath));
    let wifeCircle = await Jimp.read(await circle(wifeAvatarPath));
    
    // Resize background and add avatars
    backgroundImg.resize(800, 450);
    
    // Add heart in the middle
    const heartEmoji = await Jimp.read(await createHeart());
    
    // Position avatars and heart
    backgroundImg
      .composite(husbandCircle.resize(217, 217), 95, 95)
      .composite(wifeCircle.resize(210, 210), 484, 103.5)
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
    if (fs.existsSync(husbandAvatarPath)) fs.unlinkSync(husbandAvatarPath);
    if (fs.existsSync(wifeAvatarPath)) fs.unlinkSync(wifeAvatarPath);
    
    return outputPath;
  } catch (error) {
    console.error("Error creating wife image:", error);
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
  // Create a simple heart shape using red color
  const heart = new Jimp(80, 80, '#ff1744');
  heart.circle();
  return await heart.getBufferAsync("image/png");
}

module.exports.run = async function({ event, api, args, Users }) {
  const fs = require("fs-extra");
  const { threadID, messageID, senderID } = event;
  
  try {
    // Send processing message
    const processingMsg = await api.sendMessage("💕 খুঁজে দেখি তোমার ভবিষ্যৎ স্ত্রী কে হতে পারে... 💕", threadID);
    
    // Get sender info
    const senderInfo = await Users.getData(senderID);
    const senderName = senderInfo.name || "Unknown";
    
    // Find random female from group
    const futureWife = await getRandomFemale(api, threadID, senderID, Users);
    
    if (!futureWife) {
      api.unsendMessage(processingMsg.messageID);
      return api.sendMessage("❌ গ্রুপে কোনো মেয়ে খুঁজে পাওয়া যায়নি!", threadID, messageID);
    }
    
    // Create the image
    const imagePath = await makeWifeImage({ 
      husband: senderID, 
      wife: futureWife.id 
    });
    
    // Romantic messages in Bengali
    const romanticMessages = [
      `💕 আহা! ${senderName} এর ভবিষ্যৎ স্ত্রী হবে ${futureWife.name}! 💕\n\n💌 "তুমি আমার হৃদয়ের রানী, আমার স্বপ্নের পরী। তোমার সাথেই আমার জীবন সম্পূর্ণ হবে।" 💌\n\n💖 শুভকামনা রইলো তোমাদের ভবিষ্যতের জন্য! 💖`,
      
      `💕 বাহ! ${senderName} আর ${futureWife.name} এর জুটি দেখতে খুবই সুন্দর! 💕\n\n💌 "ভালোবাসা মানে শুধু তোমাকেই চাওয়া। তুমি আমার জীবনের একমাত্র সত্য।" 💌\n\n🌹 তোমাদের প্রেমের গল্প হোক চিরকালীন! 🌹`,
      
      `💕 দারুণ! ${senderName} এর জীবনসঙ্গী হবে ${futureWife.name}! 💕\n\n💌 "তোমার হাসিতেই আমার সকাল, তোমার চোখেই আমার রাত। তুমিই আমার পৃথিবী।" 💌\n\n💝 তোমাদের ভালোবাসা হোক অবিনশ্বর! 💝`,
      
      `💕 অসাধারণ! ${senderName} আর ${futureWife.name} এর মধ্যে দুর্দান্ত কেমিস্ট্রি! 💕\n\n💌 "প্রেম মানে কখনো ছেড়ে না যাওয়া। তুমি আমার হৃদয়ের একমাত্র রাজা।" 💌\n\n🎉 তোমাদের সুখী দাম্পত্য জীবনের শুভেচ্ছা! 🎉`
    ];
    
    const randomMessage = romanticMessages[Math.floor(Math.random() * romanticMessages.length)];
    
    // Remove processing message
    api.unsendMessage(processingMsg.messageID);
    
    // Send result
    api.sendMessage({
      body: randomMessage,
      mentions: [
        { tag: senderName, id: senderID },
        { tag: futureWife.name, id: futureWife.id }
      ],
      attachment: fs.createReadStream(imagePath)
    }, threadID, () => {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }, messageID);
    
  } catch (error) {
    console.error("Future wife command error:", error);
    api.sendMessage("❌ দুঃখিত, ভবিষ্যৎ স্ত্রী খুঁজতে কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন!", threadID, messageID);
  }
};
