module.exports.config = {
  name: "adminNoti",
  version: "1.0.0",
  eventType: ["log:subscribe"],
  credits: "TOHI-BOT-HUB (Noti by Tohidul)",
  description: "New group join alert to admin inbox",
};

const ADMIN_ID = "100092006324917"; // 🛑 Replace with your real Facebook UID (NOT threadID)

module.exports.run = async function ({ event, api, Threads }) {
  const { threadID, logMessageData } = event;
  const addedID = logMessageData.addedParticipants?.[0]?.userFbId;

  // ✅ Only when bot is added
  if (addedID !== api.getCurrentUserID()) return;

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const threadName = threadInfo.threadName || "Unnamed Group";
    const memberCount = threadInfo.participantIDs.length;

    const msg = `
🤖 ${threadName} গ্রুপে আমাকে অ্যাড করা হয়েছে!
🆔 Group ID: ${threadID}
👥 মেম্বার: ${memberCount}
📩 অ্যাড করে: ${logMessageData.addedParticipants[0]?.fullName || "Unknown"}

🚩 ＴＯＨＩ-ＢＯＴ`;

    await api.sendMessage(msg, ADMIN_ID);
  } catch (err) {
    console.error("Group Join Notify Error:", err.message);
  }
};
