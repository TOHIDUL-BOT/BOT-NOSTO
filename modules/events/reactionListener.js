module.exports.config = {
    name: "reactionListener",
    eventType: ["message_reaction"],
    version: "1.0.0",
    credits: "TOHI-BOT-HUB",
    description: "Advanced reaction listener for immediate unsend response"
};

module.exports.run = async ({ api, event, Threads }) => {
    try {
        const { threadID, messageID, userID, reaction, senderID } = event;

        // Get thread data and force enable ReactUnsend
        const threadData = await Threads.getData(threadID);
        if (!threadData.reactUnsend) {
            await Threads.setData(threadID, { reactUnsend: true });
        }

        const botID = api.getCurrentUserID();
        const adminIDs = global.config.ADMINBOT || [];

        // Only process if it's admin reacting to bot's message
        if (senderID === botID && adminIDs.includes(userID)) {
            // All possible unsend reactions
            const unsendReactions = [
                "😠", "😡", "❌", "🗑️", "🚮", "💀",
                "\uD83D\uDE20", // 😠
                "\uD83D\uDE21", // 😡
                "\u274C",       // ❌
                "\uD83D\uDDD1\uFE0F", // 🗑️
                "\uD83D\uDEAE"  // 🚮
            ];

            if (unsendReactions.includes(reaction)) {
                try {
                    await api.unsendMessage(messageID);
                } catch (error) {
                    // Silent error handling
                }
            }
        }

    } catch (error) {
        console.error("❌ ReactionListener error:", error);
    }
};