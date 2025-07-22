const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "leave",
  eventType: ["log:unsubscribe"],
  version: "7.3.1",
  credits: "TOHI-BOT-HUB ",
  description: "🎭 Smart leave + anti-out with auto condition & silent off mode"
};

function stylishText(text, type = "default") {
  const styles = {
    fire: `🔥 ${text} 🔥`,
    boss: `👑 ${text} 👑`,
    rip: `🪦 ${text} 🪦`,
    silent: `🔇 ${text} 🔇`,
    warning: `⚠️ ${text} ⚠️`,
    bot: `🤖 ${text} 🤖`
  };
  return styles[type] || `✨ ${text} ✨`;
}

module.exports.run = async function ({ api, event, Users, Threads }) {
  try {
    const { threadID, author } = event;
    const leftID = event.logMessageData.leftParticipantFbId;

    if (leftID == api.getCurrentUserID()) return;

    const data = (await Threads.getData(threadID)).data || {};
    const antiOut = data.antiout === true;
    const isSelfLeave = leftID === author;
    const isKicked = author !== leftID;

    const name = global.data.userName.get(leftID) || await Users.getNameUser(leftID) || "User";

    // ✅ Anti-Out ON: Self Leave Detected
    if (isSelfLeave && antiOut) {
      return api.addUserToGroup(leftID, threadID, async (err) => {
        if (err) {
          // Fail silently — কোনো মেসেজ যাবে না
          return;
        } else {
          const successMsg = `
${stylishText("Tumi Chipay Jaba..!", "boss")}

😎 ${name} Tomake To Ami Jete Dibo Na Botsho!
🛡 Pida Halare Niya Ansi.

🚩 Ew'r MaKiMa`;

          const vid = path.join(__dirname, "cache", "leave", "antiout.mp4");
          const sendVid = fs.existsSync(vid) && fs.statSync(vid).size > 1000;

          return api.sendMessage({
            body: successMsg,
            attachment: sendVid ? fs.createReadStream(vid) : undefined
          }, threadID);
        }
      });
    }

    // ❌ Anti-Out OFF + Self Leave = Silent Mode
    if (isSelfLeave && !antiOut) return;

    // 👢 Kicked = Message always
    if (isKicked) {
      const kickMsg = `
${stylishText(" 🥹 Bhai Tmi Chander Deshe 😞!", "fire")}

🚷 ${name} Ei Bhai Ke Chander Deshe Pathiye Deya Hoise ।
😭 Kose2 🥹

🚩 Ew'r MaKiMa`;
      return api.sendMessage(kickMsg, threadID);
    }

  } catch (err) {
    console.error("AntiOut Error:", err.message);
    try {
      const id = event.logMessageData.leftParticipantFbId;
      const name = global.data.userName.get(id) || "User";
      const fallback = `
${stylishText(" AHA MANUSH...", "silent")}
😥 ${name} CHOLE GELA PIOO 😞

🚩 Er'r MakiMa`;
      return api.sendMessage(fallback, event.threadID);
    } catch (fallbackErr) {
      console.error("Fallback failed:", fallbackErr.message);
    }
  }
};
