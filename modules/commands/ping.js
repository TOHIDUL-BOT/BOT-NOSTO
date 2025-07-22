module.exports.config = {
	name: "ping",
	version: "1.0.0",
	hasPermssion: 0,
	credits: "TOHI-BOT-HUB",
	description: "Bot's network ping (latency) check",
	commandCategory: "system",
	usages: "/ping",
	cooldowns: 2,
	usePrefix: true,
};

module.exports.run = async function({ api, event }) {
	const start = Date.now();
	api.sendMessage("🏓 Calculating ping...", event.threadID, (err, info) => {
		if (err) return;
		const latency = Date.now() - start;
		const replyMsg = `🏓 𝗣𝗢𝗡𝗚! 𝗡𝗲𝘁𝘄𝗼𝗿𝗸 𝗣𝗶𝗻𝗴: ${latency} ms\n『🔰』𝑪𝒓𝒆𝒅𝒊𝒕: 𝑻𝑶𝑯𝑰-𝑩𝑶𝑻-𝑯𝑼𝑩`;
		api.editMessage(replyMsg, info.messageID, event.threadID);
	}, event.messageID);
};