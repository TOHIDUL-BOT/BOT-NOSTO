const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "married2",
  version: "1.0.0",
  hasPermssion: 0,
  usePrefix: true,
  credits: "TOHI-BOT-HUB", 
  description: "Create married image between two users",
  commandCategory: "love",
  usages: "[tag someone]",
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    "axios": ""
  }
};

module.exports.run = async function ({ event, api, args, Users }) {    
  const { threadID, messageID, senderID, mentions } = event;
  const mentionId = Object.keys(mentions)[0];

  if (!mentionId) {
    return api.sendMessage("💒 Please mention someone to marry them!", threadID, messageID);
  }

  try {
    // Get user info
    const senderInfo = await Users.getData(senderID);
    const mentionInfo = await Users.getData(mentionId);

    const senderName = senderInfo.name || "User";
    const mentionName = mentionInfo.name || mentions[mentionId]?.replace('@', '');

    // Get avatars
    const senderAvatar = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const mentionAvatar = `https://graph.facebook.com/${mentionId}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    // Create married message
    const marriedMessage = `💒 CONGRATULATIONS! 💒\n\n👰 ${senderName} ❤️ ${mentionName} 🤵\n\n🎉 You are now married! 🎉\n💍 May your love last forever! 💍`;

    // Download avatars and send
    const senderImg = await axios.get(senderAvatar, { responseType: 'stream' });
    const mentionImg = await axios.get(mentionAvatar, { responseType: 'stream' });

    return api.sendMessage({
      body: marriedMessage,
      mentions: [
        { tag: senderName, id: senderID },
        { tag: mentionName, id: mentionId }
      ],
      attachment: [senderImg.data, mentionImg.data]
    }, threadID, messageID);

  } catch (error) {
    console.log("Error in married command:", error.message);
    return api.sendMessage("❌ An error occurred while creating the married image.", threadID, messageID);
  }
};