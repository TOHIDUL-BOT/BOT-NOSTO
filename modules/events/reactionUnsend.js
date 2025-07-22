
module.exports.config = {
	name: "reactionUnsend",
	eventType: ["message_reaction"],
	version: "1.0.0",
	credits: "Assistant",
	description: "Handle reaction-based message management"
};

module.exports.run = async ({ api, event, Threads }) => {
	try {
		const { threadID, messageID, userID, reaction, senderID } = event;
		
		// ReactUnsend is always enabled for all threads
		const threadData = await Threads.getData(threadID);
		// Force enable if not set
		if (!threadData.reactUnsend) {
			await Threads.setData(threadID, { reactUnsend: true });
		}
		
		// Get bot's user ID
		const botID = api.getCurrentUserID();
		
		// Only process reactions on bot's messages
		if (senderID !== botID) return;
		
		// Check if reaction is from admin/authorized user
		const adminIDs = global.config.ADMINBOT || [];
		
		if (!adminIDs.includes(userID)) {
			return;
		}
		
		// Define unsend trigger reactions with multiple Unicode representations
		const unsendReactions = [
			"😠", "😡", "❌", "🗑️", "🚮", "💀", "👎",
			"\uD83D\uDE20", "\uD83D\uDE21", "\u274C", "\uD83D\uDDD1\uFE0F", "\uD83D\uDEAE", "\uD83D\uDC80", "\uD83D\uDC4E",
			"angry", "rage", "x", "trash", "mad", "delete"
		];
		
		// Normalize reaction for comparison
		const normalizedReaction = reaction.toLowerCase().trim();
		
		// Check if reaction matches unsend triggers
		if (unsendReactions.includes(reaction) || unsendReactions.includes(normalizedReaction)) {
			try {
				// Unsend the message
				await api.unsendMessage(messageID);
				console.log(`Message ${messageID} unsent via reaction by ${userID}`);
			} catch (error) {
				console.error("Failed to unsend message:", error);
			}
		}
		
	} catch (error) {
		console.error("ReactionUnsend event error:", error);
	}
};
