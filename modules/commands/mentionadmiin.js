module.exports.config = {
  commandCategory: "USER",
  name: "MENTION ADMIN",
  version: "1.0.2",
  permission: 0,
  credits: "TOHI-BOT-HUB",
  description: "If someone mentions @MD Tohidul Islam, send a random reply",
  usePrefix: true,
  category: "USER",
  usages: "tag",
  cooldowns: 5,
};

// Change this to your display name as it appears in group mention
const ownerName = ["MD Tohidul Islam", "tohidul", "Tohidul", "@TO HI Dul", "@MD Tohidul Islam"];

module.exports.handleEvent = function({ api, event }) {
  // Check if anyone mentioned "MD Tohidul Islam" in this message
  if (event.mentions) {
    // Find if any mentioned name matches ownerName (case insensitive)
    for (const uid in event.mentions) {
      const name = event.mentions[uid];
      if (
        typeof name === "string" &&
        ownerName.some(owner => name.trim().toLowerCase() === owner.toLowerCase()) &&
        event.senderID !== uid // Don't reply if sender is the owner
      ) {
        const msgList = [
          "😾_ BOSS KE MENTION DICCHIS KEN 😾",
          "- AJKE BOSS ER MON BHALO NAI 😞",
          "MENTION NA DIYE BOSS RE EKTA গফ DILEO TO PARO 🥹",
          "BOSS EKHON CHANDE DON'T DISTURB 🌚😹",
          "AR MENTION DILE BOSS TORE CHIPAY LOIYYA JABE 😒👀",
          "EKTA SAD SONG SUNAO BOSS ER MOOD OFF 🥹😞",
          "JAH JAH VAG BOSS BUSY ACHE 🦆💨",
          " - JAH GHUMA KHALI MENTION DESS BOSS RE BOSS BUSY-,😒",
        ];
        const randomMsg = msgList[Math.floor(Math.random() * msgList.length)];
        return api.sendMessage(randomMsg, event.threadID, event.messageID);
      }
    }
  }
};

module.exports.run = async function({}) {};
