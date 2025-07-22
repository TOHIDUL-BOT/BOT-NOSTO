module.exports.config = {
  commandCategory: "group",
  name: "tid",	
  version: "1.0.0", 
	permission: 0,
	credits: "TOHI-BOT-HUB",
	description: "get box id", 
	usePrefix: true,
	category: "without prefix",
	usages: "user",
	cooldowns: 5, 
	dependencies: '',
};

module.exports.run = async function({ api, event }) {
  api.sendMessage("group id : "+event.threadID, event.threadID, event.messageID);
};