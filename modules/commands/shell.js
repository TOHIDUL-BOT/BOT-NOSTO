const { exec } = require('child_process');

module.exports.config = {
    name: "shell",
    aliases: ["sh"],
    version: "1.1.0",
    credits: "TOHI-BOT-HUB",
    hasPermssion: 2,
    description: "Execute shell commands",
    commandCategory: "system",
    guide: "<command>",
    coolDowns: 5,
    usePrefix: true
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;

    // Only allow OWNER (edit here if needed)
    if (String(senderID) !== "100092006324917")
        return api.sendMessage("⛔️ এই কমান্ড শুধু OWNER চালাতে পারবে!", threadID, messageID);

    if (!args.length) {
        return api.sendMessage("⛔️ দয়া করে একটা shell কমান্ড দিন!", threadID, messageID);
    }

    const command = args.join(' ');

    exec(command, { timeout: 60000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        let output = "";
        if (error) output = `❌ Error: ${error.message}`;
        else if (stderr) output = `⚠️ Stderr:\n${stderr}`;
        else output = stdout || "✅ Command executed successfully with no output.";

        // Limit single message size (Messenger limit ~3900 chars)
        const chunkSize = 3500;
        if (output.length > chunkSize) {
            for (let i = 0; i < output.length; i += chunkSize) {
                api.sendMessage("```sh\n" + output.slice(i, i + chunkSize) + "\n```", threadID);
            }
        } else {
            api.sendMessage("```sh\n" + output + "\n```", threadID, messageID);
        }
    });
};
