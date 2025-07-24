module.exports.config = {
  name: "uns",
  aliases: ["unsend", "u"],
  version: "1.0.6",
  permission: 0,
  credits: "TOHI-BOT-HUB (Fix by ChatGPT)",
  usePrefix: true,
  description: "Unsend bot messages via reply or reaction",
  commandCategory: "user",
  usages: "[reply/reaction] unsends bot message",
  cooldowns: 3
};

module.exports.languages = {
  en: {
    returnCant: "⚠️ You can only unsend bot's own messages.",
    missingReply: "❌ Please reply to a bot message to unsend it.",
    unsendSuccess: "✅ Message unsent successfully!",
    unsendFailed: "❌ Failed to unsend this message. It may already be deleted or expired."
  }
};

module.exports.handleReaction = async function ({ api, event }) {
  const angryEmojis = ["😠", "😡", "❌", "🗑️", "🚮"];
  const botID = api.getCurrentUserID();
  if (!angryEmojis.includes(event.reaction)) return;

  try {
    const messageInfo = await api.getMessageInfo(event.messageID);
    const message = messageInfo?.message || {};
    if (message.senderID !== botID) return;

    api.unsendMessage(event.messageID, (err) => {
      if (err) {
        console.error("Reaction unsend error:", err);
      }
    });
  } catch (e) {
    console.error("getMessageInfo failed:", e.message);
  }
};

module.exports.run = async function ({ api, event, getText }) {
  if (event.type !== "message_reply")
    return api.sendMessage(getText("missingReply"), event.threadID, event.messageID);

  const botID = api.getCurrentUserID();
  const replyMsg = event.messageReply;

  if (replyMsg.senderID !== botID)
    return api.sendMessage(getText("returnCant"), event.threadID, event.messageID);

  api.unsendMessage(replyMsg.messageID, (err) => {
    if (err) {
      console.error("Unsend error:", err.message || err);
      return api.sendMessage(getText("unsendFailed"), event.threadID, event.messageID);
    }

    api.unsendMessage(event.messageID, (err2) => {
      if (err2) {
        console.warn("Couldn't unsend user trigger message:", err2.message);
      }
    });
  });
};
