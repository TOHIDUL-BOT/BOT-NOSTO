
module.exports.config = {
	name: "rank",
	version: "1.0.0",
	hasPermssion: 0,
	credits: "TOHI-BOT-HUB",
	description: "Show your rank with beautiful design",
	usePrefix: true,
	commandCategory: "user",
	usages: "[@mention]",
	cooldowns: 5
};

module.exports.run = async function({ api, event, Users, Currencies }) {
	const { threadID, senderID, messageID, mentions } = event;
	const fs = require('fs');
	const axios = require('axios');

	try {
		// Get all user IDs
		const allUsers = global.data.allUserID || [];
		if (allUsers.length === 0) {
			return api.sendMessage("❌ No user data found to calculate rankings!", threadID, messageID);
		}

		// Build rankings
		const userRankingsRaw = await Promise.all(
			allUsers.map(async (uid) => {
				try {
					const [data, userData] = await Promise.all([
						Currencies.getData(uid),
						Users.getData(uid)
					]);
					if (!userData || !userData.name) return null;
					const exp = data.exp || 0;
					if (exp === 0) return null;
					const level = Math.floor((Math.sqrt(1 + (4 * exp / 3) + 1) / 2));
					return { uid, name: userData.name, exp, level };
				} catch {
					return null;
				}
			})
		);

		// Filter and sort rankings
		const userRankings = userRankingsRaw.filter(Boolean);
		userRankings.sort((a, b) => b.exp - a.exp);

		// Find target user
		let targetID = senderID;
		if (mentions && Object.keys(mentions).length > 0) {
			targetID = Object.keys(mentions)[0];
		}

		// Find user's ranking
		const user = userRankings.find(u => u.uid === targetID);
		if (!user) {
			return api.sendMessage("❌ User has no experience points yet!", threadID, messageID);
		}

		const userRank = userRankings.findIndex(u => u.uid === targetID) + 1;
		const userData = await Users.getData(targetID);
		
		// Calculate level progress
		const currentLevelExp = Math.pow(user.level, 2) * 3;
		const nextLevelExp = Math.pow(user.level + 1, 2) * 3;
		const progressExp = user.exp - currentLevelExp;
		const requiredExp = nextLevelExp - currentLevelExp;
		const progressPercent = Math.min((progressExp / requiredExp) * 100, 100);
		
		// Create progress bar (20 characters wide)
		const filledBars = Math.floor((progressPercent / 100) * 20);
		const emptyBars = 20 - filledBars;
		const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

		// Get level colors (gradient effect)
		const getLevelColor = (level) => {
			const colors = ['🟢', '🔵', '🟡', '🟠', '🔴', '🟣', '⚫', '⚪', '🟤', '🔶'];
			return colors[level % colors.length];
		};

		const levelColor = getLevelColor(user.level);

		// Create beautiful rank message
		const rankMessage = 
			`╭─────────────────────────╮\n` +
			`│    🏆 𝗥𝗔𝗡𝗞 𝗜𝗡𝗙𝗢 🏆    │\n` +
			`╰─────────────────────────╯\n\n` +
			
			`👤 𝗡𝗮𝗺𝗲: ${user.name}\n` +
			`🏅 𝗥𝗮𝗻𝗸: #${userRank}/${userRankings.length}\n` +
			`${levelColor} 𝗟𝘃: ${user.level}\n` +
			`✨ 𝗘𝘅𝗽: ${user.exp.toLocaleString()}\n\n` +
			
			`╭─ 𝗡𝗲𝘅𝘁 𝗟𝗲𝘃𝗲𝗹 𝗣𝗿𝗼𝗴𝗿𝗲𝘀𝘀 ─╮\n` +
			`│ ${progressBar} │\n` +
			`│   ${progressPercent.toFixed(1)}% (${progressExp}/${requiredExp})   │\n` +
			`╰─────────────────────────╯\n\n` +
			
			`🎯 ${userRank <= 10 ? "🔥 Top 10 Player!" : 
				userRank <= 50 ? "⚡ Top 50 Player!" : 
				userRank <= 100 ? "📈 Top 100 Player!" : "💪 Keep grinding!"}\n\n` +
				
			`━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
			`🌟 Made by TOHI-BOT-HUB 🌟`;

		// Try to get user's profile picture and send with attachment
		try {
			const profilePicUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
			
			const response = await axios.get(profilePicUrl, { 
				responseType: 'stream',
				timeout: 10000 
			});
			
			const imagePath = __dirname + `/cache/rank_${targetID}.jpg`;
			const writer = fs.createWriteStream(imagePath);
			response.data.pipe(writer);
			
			await new Promise((resolve, reject) => {
				writer.on('finish', resolve);
				writer.on('error', reject);
			});

			return api.sendMessage({
				body: rankMessage,
				attachment: fs.createReadStream(imagePath)
			}, threadID, () => {
				// Clean up the image file
				try {
					fs.unlinkSync(imagePath);
				} catch (e) {}
			}, messageID);

		} catch (error) {
			// If profile picture fails, send without image
			return api.sendMessage(rankMessage, threadID, messageID);
		}

	} catch (error) {
		console.error('Rank command error:', error);
		return api.sendMessage("❌ An error occurred while fetching rank data!", threadID, messageID);
	}
};
