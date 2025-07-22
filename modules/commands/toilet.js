module.exports.config = {
  name: "toilet",
  version: "2.0.0",
  hasPermssion: 0,
  usePrefix: true,
  credits: "TOHI-BOT-HUB",
  description: "Send someone to toilet with a funny image",
  commandCategory: "fun",
  usages: "@mention or reply",
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    "axios": "",
    "jimp": ""
  }
};

const OWNER_UIDS = ["100092006324917"];

// Circle crop function using Jimp with error handling
module.exports.circle = async (image) => {
  try {
    const jimp = global.nodemodule['jimp'];
    if (!jimp) {
      throw new Error('Jimp module not available');
    }

    const processedImage = await jimp.read(image);
    processedImage.circle();
    return await processedImage.getBufferAsync("image/png");
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
};

module.exports.run = async function ({ event, api, args, Users }) {
  try {
    const axios = global.nodemodule["axios"];
    const fs = global.nodemodule["fs-extra"];
    const jimp = global.nodemodule["jimp"];

    const pathToilet = __dirname + '/cache/toilet_' + Date.now() + '.png';

    // Get target user ID (from mention, reply, or sender)
    let targetID;
    if (Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    } else if (event.messageReply) {
      targetID = event.messageReply.senderID;
    } else {
      targetID = event.senderID;
    }

    // Check if owner is being targeted
    if (OWNER_UIDS.includes(targetID) && !OWNER_UIDS.includes(event.senderID)) {
      return api.sendMessage(
        `😹👑 হালা tui বাপরে toilet এ পাঠাবি! সম্ভব না! 🚽❌\n\n😎 Boss কে toilet এ পাঠানো যায় না! তোর সাহস দেখে মজা লাগলো! 💪`,
        event.threadID,
        event.messageID
      );
    }

    // Get user name for message
    const targetName = await Users.getNameUser(targetID) || "Unknown User";

    // Send processing message
    const processingMsg = await api.sendMessage("🚽 Toilet preparation in progress... 💩", event.threadID);

    // Create canvas (if not available, we will use Jimp instead)
    const backgroundImageUrl = 'https://i.imgur.com/Kn7KpAr.jpg';

    let background;
    try {
      background = await jimp.read(backgroundImageUrl);
    } catch (error) {
      // If background fails, use a default background color
      background = new jimp(500, 670, '#87CEEB'); // Sky blue color
    }

    // Prepare the image and draw on it
    const canvas = await new jimp(500, 670, background);

    // Avatar URL
    let avatarUrl = `https://graph.facebook.com/${targetID}/picture?type=large`;

    let avatarImage;
    try {
      const avatarResponse = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
      avatarImage = await jimp.read(avatarResponse.data);
    } catch (error) {
      avatarImage = new jimp(100, 100, '#4A90E2'); // Default placeholder if avatar fails
    }

    // Apply a circular crop to the avatar
    const circularAvatar = await module.exports.circle(avatarImage);

    // Draw the avatar on the image
    const avatar = await jimp.read(circularAvatar);
    canvas.composite(avatar, 135, 350); // Draw it on the canvas

    // Save the final image in the cache
    await canvas.writeAsync(pathToilet);

    // Unsend processing message
    api.unsendMessage(processingMsg.messageID);

    // Send the final image with a funny message
    const funnyMessages = [
      `🚽💩 ${targetName} এখন toilet এ বসে আছে! 😂`,
      `🚽 ${targetName} কে toilet এ পাঠিয়ে দেওয়া হয়েছে! 💩😹`,
      `💩 ${targetName} এর toilet break time! 🚽😂`,
      `🚽 ${targetName} এখন busy toilet এ! 💩🤣`
    ];

    const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];

    return api.sendMessage({
      body: randomMessage,
      attachment: fs.createReadStream(pathToilet)
    }, event.threadID, () => {
      // Clean up the image file after sending
      if (fs.existsSync(pathToilet)) {
        fs.unlinkSync(pathToilet);
      }
    }, event.messageID);

  } catch (error) {
    return api.sendMessage(
      `❌ Toilet command failed! Error: ${error.message}\n\nPlease try again later.`,
      event.threadID,
      event.messageID
    );
  }
};
