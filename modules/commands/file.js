module.exports.config = {
  name: "file",
  version: "1.0.1",
  hasPermssion: 2,
  credits: "TOHI-BOT-HUB",
  description: "Show file code by filename",
  usePrefix: true,
  commandCategory: "BOT ADMIN",
  usages: "file <filename.js>",
  cooldowns: 3
};

const fs = require("fs");
const path = require("path");

module.exports.run = async function({ event, args, api }) {
  const { threadID, messageID } = event;
  // Only allow bot owner
  if (String(event.senderID) !== "100092006324917")
      return api.sendMessage("⛔️ শুধু বট মালিক এই কমান্ড চালাতে পারবে!", threadID, messageID);

  if (!args[0])
      return api.sendMessage("🔎 Example: file filename.js", threadID, messageID);

  const fileName = args.join(" ");
  const filePath = path.join(__dirname, fileName);

  // Check if file exists and is a file
  if (!fs.existsSync(filePath) || !fs.lstatSync(filePath).isFile())
      return api.sendMessage(`❌ ফাইল "${fileName}" পাওয়া যায়নি!`, threadID, messageID);

  // Read file content
  let fileContent;
  try {
      fileContent = fs.readFileSync(filePath, "utf8");
  } catch (err) {
      return api.sendMessage(`❌ ফাইল পড়তে সমস্যা হয়েছে!\n${err}`, threadID, messageID);
  }

  // If file is too large, split into multiple messages (<= 4000 chars per msg)
  const chunkSize = 3900;
  if (fileContent.length > chunkSize) {
      let chunks = [];
      for (let i = 0; i < fileContent.length; i += chunkSize) {
          chunks.push(fileContent.substring(i, i + chunkSize));
      }
      // Send each chunk as pure code, no extra message
      for (let chunk of chunks) {
        await api.sendMessage(chunk, threadID);
      }
  } else {
      await api.sendMessage(fileContent, threadID, messageID);
  }
};