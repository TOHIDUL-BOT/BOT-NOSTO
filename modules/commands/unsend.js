module.exports.config = {
  name: "uns",
  aliases: ["unsend","u"],
  version: "1.0.5",
  permission: 0,
  credits: "TOHI-BOT-HUB",
  usePrefix: true,
  description: "Unsend bot messages by reply or reaction",
  commandCategory: "user",
  usages: "Reply to bot message to unsend it",
  cooldowns: 3
};

module.exports.languages = {
  en: {
    returnCant: "Can't unsend message from other user.",
    missingReply: "Reply to the message you want to unsend.",
    unsendSuccess: "Message unsent successfully!",
    unsendFailed: "Failed to unsend this message."
  }
};

module.exports.run = function ({ api, event, getText }) {
  const angryEmojis = ["😠", "😡", "❌", "🗑️", "🚮"];
  const messageBody = (event.body || "").trim();

  if (angryEmojis.includes(messageBody)) return;

  if (event.type !== "message_reply") {
    return api.sendMessage(getText("missingReply"), event.threadID, event.messageID);
  }

  if (event.messageReply.senderID !== api.getCurrentUserID()) {
    return api.sendMessage(getText("returnCant"), event.threadID, event.messageID);
  }

  api.unsendMessage(event.messageReply.messageID, (err) => {
    if (err) {
      console.error("Unsend error:", err);
      return api.sendMessage(getText("unsendFailed"), event.threadID, event.messageID);
    }

    api.unsendMessage(event.messageID, (err) => {
      if (err) console.warn("Couldn't unsend user command message:", err.message);
    });
  });
};
