const axios = require('axios');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

module.exports.config = {
  name: "install",
  version: "1.0.1",
  hasPermssion: 2,
  credits: "TOHI-BOT-HUB",
  usePrefix: true,
  description: "Create a new file with code from a link or provided code, with syntax error checking",
  commandCategory: "bot admin",
  usages: "[file name] [link/code]",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;

  // Permission check: only for admins (you can adjust this)
  // Uncomment & edit the following if you want to restrict
  // const allowed = ["YOUR_FACEBOOK_ID"]; 
  // if (!allowed.includes(event.senderID)) return api.sendMessage("⛔️ Permission denied!", threadID, messageID);

  if (!args[0] || !args[1]) {
    return api.sendMessage("❗ দয়া করে [ফাইলনেম] ও কোড/লিংক উভয়ই দিন!\nউদাহরণ: install test.js https://pastebin.com/raw/xxxx বা install test.js console.log(1)", threadID, messageID);
  }

  const fileName = args[0];
  const input = args.slice(1).join(" ");

  // Validate filename
  if (!/^[\w\-\.]+\.js$/.test(fileName))
    return api.sendMessage("❗ শুধুমাত্র .js ফাইলের নাম (a-z, 0-9, _, -, .) দিন!", threadID, messageID);

  let code;
  const linkPattern = /^(http|https):\/\/[^ "]+$/;

  try {
    if (linkPattern.test(input)) {
      const response = await axios.get(input);
      code = response.data;
    } else {
      code = input;
    }

    // Syntax check
    try {
      new vm.Script(code);
    } catch (syntaxError) {
      return api.sendMessage(`❌ Syntax error in the provided code:\n${syntaxError.message}`, threadID, messageID);
    }

    // Write file
    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, code, "utf-8");

    return api.sendMessage(`✅ ফাইল তৈরি হয়েছে: ${fileName}`, threadID, messageID);
  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ ফাইল তৈরি করতে সমস্যা হয়েছে!", threadID, messageID);
  }
};
