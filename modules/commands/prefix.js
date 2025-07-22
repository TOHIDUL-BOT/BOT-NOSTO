module.exports.config = {
    name: "prefix",
    version: "2.0.5",
    hasPermssion: 0,
    usePrefix: false,
    credits: "TOHI-BOT-HUB",
    description: "Display current prefix info",
    commandCategory: "system",
    usages: "",
    cooldowns: 3,
};

module.exports.run = async ({ api, event, Threads }) => {
    const { threadID, messageID, body } = event;

    try {
        // Get global and box prefix
        const globalPrefix = (global.config.PREFIX || "!").toLowerCase();
        const threadData = (await Threads.getData(threadID)).data || {};
        // যদি box prefix override থাকে, তা নাও, না থাকলে globalPrefix
        const boxPrefix = (threadData.PREFIX || globalPrefix).toLowerCase();

        // Input message (trimmed, lowercase)
        const input = (body || "").trim().toLowerCase();

        // Accept if:
        // - input is just "prefix"
        // - input is just boxPrefix (e.g. "=")
        // - input is boxPrefix+"prefix" (e.g. "=prefix")
        // - (if boxPrefix !== globalPrefix): input is just globalPrefix (e.g. "/") or globalPrefix+"prefix" (e.g. "/prefix")
        if (
            input === "prefix" ||
            input === boxPrefix ||
            input === (boxPrefix + "prefix") ||
            (boxPrefix !== globalPrefix && (
                input === globalPrefix || input === (globalPrefix + "prefix")
            ))
        ) {
            let prefixInfo = `🤖 𝐁𝐨𝐭 𝐍𝐚𝐦𝐞: ${global.config.BOTNAME || "TOHI-BOT"}\n`;
            prefixInfo += `🌐 𝐆𝐥𝐨𝐛𝐚𝐥 𝐏𝐫𝐞𝐟𝐢𝐱: "${global.config.PREFIX}"\n`;
            if (boxPrefix !== globalPrefix) {
                prefixInfo += `🏠 𝐁𝐨𝐱 𝐏𝐫𝐞𝐟𝐢𝐱: "${threadData.PREFIX}"`;
            } else {
                prefixInfo += `🏠 𝐁𝐨𝐱 𝐏𝐫𝐞𝐟𝐢𝐱: "${global.config.PREFIX}" (𝐃𝐞𝐟𝐚𝐮𝐥𝐭)`;
            }
            return api.sendMessage(prefixInfo, threadID, messageID);
        }
        // If none matched, do nothing
        return;

    } catch (error) {
        console.log("Prefix command error:", error);
        return api.sendMessage("❌ প্রিফিক্স তথ্য লোড করতে সমস্যা হয়েছে।", threadID, messageID);
    }
};