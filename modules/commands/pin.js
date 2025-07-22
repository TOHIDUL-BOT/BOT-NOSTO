module.exports.config = {
  name: "pin",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "TOHI-BOT-HUB",
  usePrefix: true,
  description: "Pin a message in the group",
  commandCategory: "gc admin",
  usages: "[reply to message]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  try {
    if (!event.isGroup) {
      return api.sendMessage("❌ This command can only be used in groups.", event.threadID, event.messageID);
    }

    if (!event.messageReply) {
      return api.sendMessage("❌ Please reply to a message you want to pin.", event.threadID, event.messageID);
    }

    const messageToPin = event.messageReply;

    // Save pinned message to thread data
    const threadData = global.data.threadData.get(event.threadID) || {};
    if (!threadData.pinnedMessages) {
      threadData.pinnedMessages = [];
    }

    const pinnedMessage = {
      messageID: messageToPin.messageID,
      body: messageToPin.body || "[Attachment/Media]",
      senderID: messageToPin.senderID,
      timestamp: Date.now(),
      pinnedBy: event.senderID
    };

    threadData.pinnedMessages.push(pinnedMessage);
    global.data.threadData.set(event.threadID, threadData);

    // Get user name
    let senderName = "Unknown User";
    try {
      const userInfo = await api.getUserInfo(messageToPin.senderID);
      senderName = userInfo[messageToPin.senderID]?.name || senderName;
    } catch (e) {
      // Ignore error
    }

    const pinMessage = `📌 Message Pinned!\n\n👤 From: ${senderName}\n💬 Message: ${pinnedMessage.body}\n⏰ Pinned: ${new Date().toLocaleString()}`;

    return api.sendMessage(pinMessage, event.threadID, event.messageID);

  } catch (error) {
    console.error("Pin command error:", error);
    return api.sendMessage("❌ An error occurred while pinning the message.", event.threadID, event.messageID);
  }
};