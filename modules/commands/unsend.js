
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
	"vi": {
		"returnCant": "Không thể gỡ tin nhắn của người khác.",
		"missingReply": "Hãy reply tin nhắn cần gỡ.",
		"unsendSuccess": "Đã gỡ tin nhắn thành công!",
		"unsendFailed": "Không thể gỡ tin nhắn này."
	},
	"en": {
		"returnCant": "Can't unsend message from other user.",
		"missingReply": "Reply to the message you want to unsend.",
		"unsendSuccess": "Message unsent successfully!",
		"unsendFailed": "Failed to unsend this message."
	}
};

module.exports.run = function({ api, event, getText }) {
	// Check for angry emoji in message body for direct unsend
	const angryEmojis = ["😠", "😡", "❌", "🗑️", "🚮"];
	const messageBody = event.body || "";
	
	// If message contains only angry emoji, try to unsend the last bot message
	if (angryEmojis.includes(messageBody.trim())) {
		// This will be handled by the reaction system, just return
		return;
	}
	
	// Check if this is a reply to a message
	if (event.type != "message_reply") {
		return api.sendMessage(getText("missingReply"), event.threadID, event.messageID);
	}

	// Check if the replied message is from the bot
	if (event.messageReply.senderID != api.getCurrentUserID()) {
		return api.sendMessage(getText("returnCant"), event.threadID, event.messageID);
	}

	// Unsend the bot's message
	return api.unsendMessage(event.messageReply.messageID, (err) => {
		if (err) {
			console.error("Unsend error:", err);
			return api.sendMessage(getText("unsendFailed"), event.threadID, event.messageID);
		}
		// Also unsend the user's command message for cleaner chat
		api.unsendMessage(event.messageID);endMessage(event.messageID);
	});
};

// Note: Reaction handling is now managed by dedicated event listeners
