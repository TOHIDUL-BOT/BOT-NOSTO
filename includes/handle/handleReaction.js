
module.exports = function ({ api, Users, Threads, Currencies, logger }) {
  return async function handleReaction({ event }) {
    try {
      if (!event || event.type !== "message_reaction") return;
      
      // Handle reaction-based message unsend
      const { threadID, messageID, userID, reaction, senderID } = event;
      const threadData = await Threads.getData(threadID);
      
      // Force enable ReactUnsend if not set
      if (!threadData.reactUnsend) {
        await Threads.setData(threadID, { reactUnsend: true });
      }
      
      // ReactUnsend is now always active
      const botID = api.getCurrentUserID();
      const adminIDs = global.config.ADMINBOT || [];
      
      // Check if it's admin reacting to bot's message with unsend reaction
      if (senderID === botID && adminIDs.includes(userID)) {
        // Extended list of unsend reactions with all Unicode variants
        const unsendReactions = [
          "😠", "😡", "❌", "🗑️", "🚮", "💀", "👎", "😤", "🤬",
          "\uD83D\uDE20", "\uD83D\uDE21", "\u274C", 
          "\uD83D\uDDD1\uFE0F", "\uD83D\uDEAE", "\uD83D\uDC80", "\uD83D\uDC4E", "\uD83D\uDE24", "\uD83E\uDD2C"
        ];
        
        if (unsendReactions.includes(reaction)) {
          try {
            await api.unsendMessage(messageID);
            logger.log(`Message ${messageID} unsent via reaction by ${userID}`, "INFO");
            return; // Exit early after unsending
          } catch (error) {
            logger.log(`Failed to unsend message ${messageID}: ${error.message}`, "ERROR");
          }
        }
      }
      
      const { handleReaction } = global.client;
      if (!handleReaction || !Array.isArray(handleReaction)) return;
      
      // Find matching reaction handler
      const reactionIndex = handleReaction.findIndex(react => react.messageID === messageID);
      if (reactionIndex === -1) return;
      
      const reactionData = handleReaction[reactionIndex];
      const { name, author } = reactionData;
      
      // Check if sender matches author (optional)
      if (author && author !== senderID && !global.config.ADMINBOT?.includes(senderID)) {
        return; // Only author or admin can use reaction
      }
      
      // Get command
      const { commands } = global.client;
      const command = commands.get(name);
      if (!command || !command.onReaction) return;
      
      // Create run object
      const runObj = {
        api,
        event,
        Users,
        Threads,
        Currencies,
        Reaction: reactionData,
        logger
      };
      
      try {
        // Execute onReaction with timeout
        await Promise.race([
          command.onReaction(runObj),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Reaction timeout')), 30000)
          )
        ]);
        
        // Remove reaction handler after successful execution
        handleReaction.splice(reactionIndex, 1);
        
      } catch (error) {
        logger.log(`Reaction handler error for ${name}: ${error.message}`, "DEBUG");
        
        // Remove failed reaction handler
        handleReaction.splice(reactionIndex, 1);
      }
      
    } catch (error) {
      logger.log(`HandleReaction error: ${error.message}`, "DEBUG");
    }
  };
};
