
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "groupApprovalCheck",
  eventType: ["message"],
  version: "1.0.0",
  credits: "TOHI-BOT-HUB",
  description: "Check group approval before allowing any bot interactions"
};

module.exports.run = async function({ api, event }) {
  try {
    // Only check for group messages (not personal messages)
    if (!event.threadID || event.threadID === event.senderID) return;
    
    // Check for commands (with or without prefix for approved groups)
    const prefix = global.config.PREFIX || "/";
    if (!event.body) return;
    
    const messageBody = event.body.trim();
    const startsWithPrefix = messageBody.startsWith(prefix);
    const firstWord = messageBody.split(' ')[0].toLowerCase();
    
    // Check if it's a command (with or without prefix)
    const { commands } = global.client;
    if (!commands) return; // If commands not loaded yet
    
    const allCommands = Array.from(commands.keys());
    const isKnownCommand = startsWithPrefix || 
                          allCommands.includes(firstWord) || 
                          Array.from(commands.values()).some(cmd => 
                            cmd.config.aliases && cmd.config.aliases.includes(firstWord)
                          );
    
    if (!isKnownCommand) return;
    
    const configPath = path.join(__dirname, '../../config.json');
    let config = {};
    
    try {
      const configData = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configData);
    } catch (error) {
      return;
    }
    
    // Initialize approval system if not exists
    if (!config.APPROVAL) return;
    
    const threadID = String(event.threadID);
    const senderID = String(event.senderID);
    const isOwner = global.config.ADMINBOT && global.config.ADMINBOT.includes(senderID);
    const isApproved = config.APPROVAL.approvedGroups.includes(threadID);
    const isPending = config.APPROVAL.pendingGroups.includes(threadID);
    
    // Reload config in real-time to check for latest approvals
    try {
      const freshConfigData = fs.readFileSync(configPath, 'utf8');
      const freshConfig = JSON.parse(freshConfigData);
      const isFreshlyApproved = freshConfig.APPROVAL?.approvedGroups?.includes(threadID);
      
      // If freshly approved, allow all commands
      if (isFreshlyApproved) {
        return; // Let all commands pass through
      }
    } catch (reloadError) {
      // Continue with original check if reload fails
    }

    // If group is not approved and sender is not owner
    if (!isApproved && !isOwner) {
      const command = event.body.split(' ')[0].substring(1).toLowerCase();
      
      // Allow only approve command for owner
      if (command === 'approve' && isOwner) {
        return; // Let the command pass through
      }
      
      // Block all other commands
      if (isPending) {
        api.sendMessage(
          `⏳ এই গ্রুপটি এখনো approve করা হয়নি।\n\n` +
          `🚫 Bot এর কোনো command কাজ করবে না।\n` +
          `⏰ Admin approval এর জন্য অপেক্ষা করুন।\n\n` +
          `👑 Bot Admin: ${global.config.ADMINBOT?.[0] || 'Unknown'}`,
          event.threadID
        );
      } else {
        // Group is not even in pending list, might be rejected or new
        api.sendMessage(
          `❌ এই গ্রুপে bot এর access নেই।\n\n` +
          `📞 Admin এর সাথে যোগাযোগ করুন approval এর জন্য।`,
          event.threadID
        );
      }
      
      // Block the command by setting a flag
      event.blockCommand = true;
    }
    
  } catch (error) {
    console.error('Group approval check error:', error);
  }
};
