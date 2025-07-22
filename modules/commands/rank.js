module.exports.config = {
  name: "rank",
  version: "1.3.0",
  hasPermssion: 0,
  credits: "TOHI-BOT-HUB (Copilot)",
  description: "Show your rank or mentioned user's rank",
  usePrefix: true,
  commandCategory: "user",
  usages: "[@mention]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, Users, Currencies }) {
  const { threadID, senderID, messageID, mentions } = event;

  try {
    // Get all user IDs once
    const allUsers = global.data.allUserID || [];
    if (allUsers.length === 0) {
      return api.sendMessage("❌ No user data found to calculate rankings!", threadID, messageID);
    }

    // Build rankings in parallel (faster)
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

    // Filter and fix duplicate names
    const seenNames = new Set();
    const userRankings = userRankingsRaw
      .filter(Boolean)
      .map(u => {
        let name = u.name;
        if (seenNames.has(name)) {
          name = `${name} (${u.uid.slice(-4)})`;
        }
        seenNames.add(u.name);
        return { ...u, name };
      });

    // Sort by exp (descending)
    userRankings.sort((a, b) => b.exp - a.exp);

    // Find target user: mention or sender
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
    const progressMsg = userRank <= 10 ? "🔥 Top 10!" : userRank <= 50 ? "⚡ Top 50!" : "📈 Keep going!";
    const rankMsg =
      `╭─╼⃝⸙͎༄❀ 𝑼𝒔𝒆𝒓 𝑹𝒂𝒏𝒌 ❀༄⸙⃝╾─╮\n` +
      `👤 𝑵𝒂𝒎𝒆: ${user.name}\n` +
      `🏆 𝑹𝒂𝒏𝒌: #${userRank}/${userRankings.length}\n` +
      `⭐ 𝑳𝒆𝒗𝒆𝒍: ${user.level}\n` +
      `💫 𝑬𝒙𝒑: ${user.exp.toLocaleString()}\n` +
      `📊 𝑷𝒓𝒐𝒈𝒓𝒆𝒔𝒔: ${progressMsg}\n` +
      `╰─⃝⸙͎༄❀ 𝑻𝑶𝑯𝑰-𝑩𝑶𝑻 ❀༄⸙⃝─╯`;

    return api.sendMessage(rankMsg, threadID, messageID);

  } catch (error) {
    console.error('Rank command error:', error);
    return api.sendMessage("❌ An error occurred while fetching rank data!", threadID, messageID);
  }
};