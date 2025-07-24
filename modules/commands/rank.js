const jimp = require('jimp');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "rank",
  version: "2.0.0",
  hasPermssion: 0,
  usePrefix: true,
  credits: "TOHI-BOT-HUB",
  description: "Show user rank card",
  commandCategory: "user",
  usages: "[tag]",
  cooldowns: 5,
  dependencies: {
    "jimp": "",
    "fs-extra": ""
  }
};

module.exports.run = async function({ api, event, Users }) {
  try {
    const { threadID, messageID, senderID } = event;

    // Get target user
    const mention = Object.keys(event.mentions)[0] || senderID;

    // Get user info with fallback
    let userName = "Unknown User";
    try {
      const userInfo = await api.getUserInfo(mention);
      if (userInfo && userInfo[mention] && userInfo[mention].name) {
        userName = userInfo[mention].name;
      } else {
        // Fallback to Users system
        const userData = await Users.getData(mention);
        if (userData && userData.name && userData.name !== 'undefined' && userData.name.trim()) {
          userName = userData.name;
        } else {
          // Try Users.getNameUser as last resort
          try {
            const fallbackName = await Users.getNameUser(mention);
            if (fallbackName && fallbackName !== 'undefined' && !fallbackName.startsWith('User-')) {
              userName = fallbackName;
            } else {
              userName = `User_${mention.slice(-6)}`;
            }
          } catch (nameError) {
            userName = `User_${mention.slice(-6)}`;
          }
        }
      }
    } catch (apiError) {
      console.log(`[RANK] API error getting user info for ${mention}: ${apiError.message}`);
      // Try fallback methods
      try {
        const userData = await Users.getData(mention);
        if (userData && userData.name && userData.name !== 'undefined' && userData.name.trim()) {
          userName = userData.name;
        } else {
          userName = `User_${mention.slice(-6)}`;
        }
      } catch (fallbackError) {
        userName = `User_${mention.slice(-6)}`;
      }
    }

    // Get user data (mock data for now)
    const userData = await Users.getData(mention) || {};
    const level = userData.level || Math.floor(Math.random() * 50) + 1;
    const exp = userData.exp || Math.floor(Math.random() * 10000);
    const nextLevelExp = level * 1000;

    // Create 1x5 inch canvas (72 DPI = 72x360 pixels)
    const width = 360;
    const height = 72;

    // Create base image
    const image = await jimp.create(width, height, '#2C3E50');

    // Load fonts
    const fontName = await jimp.loadFont(jimp.FONT_SANS_16_BLACK);
    const fontLevel = await jimp.loadFont(jimp.FONT_SANS_12_BLACK);

    // Create gradient-like background with mixed colors
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const gradientFactor = x / width;
        const r = Math.floor(44 + gradientFactor * (52 - 44));
        const g = Math.floor(62 + gradientFactor * (152 - 62));
        const b = Math.floor(80 + gradientFactor * (219 - 80));
        const color = (r << 24) | (g << 16) | (b << 8) | 255;
        image.setPixelColor(color, x, y);
      }
    }

    // Try to download and add profile picture
    try {
      const avatarUrl = `https://graph.facebook.com/${mention}/picture?width=64&height=64&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatar = await jimp.read(avatarUrl);

      // Resize and make circular
      avatar.resize(60, 60);
      const mask = await jimp.create(60, 60, 0x00000000);
      mask.scan(0, 0, 60, 60, function(x, y, idx) {
        const centerX = 30, centerY = 30;
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (distance <= 30) {
          this.bitmap.data[idx + 3] = 255; // Set alpha to opaque
        }
      });

      avatar.mask(mask, 0, 0);
      image.composite(avatar, 6, 6);

    } catch (error) {
      // If avatar fails, create a simple circle with first letter
      const letterCircle = await jimp.create(60, 60, '#3498DB');
      letterCircle.print(fontName, 0, 0, {
        text: userName.charAt(0).toUpperCase(),
        alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: jimp.VERTICAL_ALIGN_MIDDLE
      }, 60, 60);
      image.composite(letterCircle, 6, 6);
    }

    // Add user name (black, bold-like)
    image.print(fontName, 75, 8, {
      text: userName.length > 18 ? userName.substring(0, 18) + '...' : userName,
      alignmentX: jimp.HORIZONTAL_ALIGN_LEFT
    });

    // Add level info on left side
    image.print(fontLevel, 75, 28, {
      text: `LV: ${level}`,
      alignmentX: jimp.HORIZONTAL_ALIGN_LEFT
    });

    // Add EXP info
    image.print(fontLevel, 75, 45, {
      text: `EXP: ${exp}/${nextLevelExp}`,
      alignmentX: jimp.HORIZONTAL_ALIGN_LEFT
    });

    // Create progress bar in the middle
    const progressWidth = 120;
    const progressHeight = 8;
    const progressX = 200;
    const progressY = 32;

    // Progress bar background
    const progressBg = await jimp.create(progressWidth, progressHeight, '#34495E');
    image.composite(progressBg, progressX, progressY);

    // Progress bar fill
    const progress = exp / nextLevelExp;
    const fillWidth = Math.floor(progressWidth * progress);
    if (fillWidth > 0) {
      const progressFill = await jimp.create(fillWidth, progressHeight, '#E74C3C');
      image.composite(progressFill, progressX, progressY);
    }

    // Add "Next Level" indicator on right side
    const nextButton = await jimp.create(30, 20, '#E67E22');
    image.composite(nextButton, 325, 26);

    // Save and send image
    const outputPath = path.join(__dirname, 'cache', `rank_${mention}_${Date.now()}.png`);
    await image.writeAsync(outputPath);

    return api.sendMessage({
      body: `🏆 ${userName} এর Rank Card\n\n📊 Level: ${level}\n⚡ EXP: ${exp}/${nextLevelExp}\n🎯 Progress: ${Math.floor(progress * 100)}%`,
      attachment: fs.createReadStream(outputPath)
    }, threadID, () => {
      // Clean up file after sending
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    }, messageID);

  } catch (error) {
    console.error("Rank command error:", error);
    return api.sendMessage("❌ Error creating rank card: " + error.message, event.threadID, event.messageID);
  }
};