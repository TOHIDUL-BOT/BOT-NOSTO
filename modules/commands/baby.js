const axios = require('axios');

const baseApiUrl = async () => {
    const base = await axios.get(`https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`);
    return base.data.api;
};

module.exports.config = {
  name: "baby",
  version: "6.9.9",
  credits: "dipto",
  cooldowns: 0,
  hasPermssion: 0,
  description: "better than all sim simi",
  commandCategory: "chat",
  category: "chat",
  usePrefix: true,
  prefix: true,
  usages: `[anyMessage] OR\nlist OR\nall OR\nmsg [YourMessage]`,
};

module.exports.run = async function ({ api, event, args, Users }) {
  try {
    const link = `${await baseApiUrl()}/baby`;
    const dipto = args.join(" ").toLowerCase();
    const uid = event.senderID;

    if (!args[0]) {
      const ran = [
        "Bolo baby", "hum", "type help baby", "type !baby hi", 
        "Hey there!", "How can I help you?", "Type something to chat!", 
        "I'm here to chat!", "What's up?", "Say anything to start a chat."
      ];
      const r = ran[Math.floor(Math.random() * ran.length)];
      return api.sendMessage(r, event.threadID, event.messageID);
    }

    if (args[0] === 'list') {
      if (args[1] === 'all') {
        const res = await axios.get(`${link}?list=all`);
        const data = res.data.teacher.teacherList;
        const teachers = await Promise.all(data.map(async (item) => {
          const number = Object.keys(item)[0];
          const value = item[number];
          const name = await Users.getNameUser(number).catch(()=>{}) || "unknown";
          return { name, value };
        }));
        teachers.sort((a, b) => b.value - a.value);
        const output = teachers.map((teacher, index) => `${index + 1}/ ${teacher.name}: ${teacher.value}`).join('\n');
        return api.sendMessage(`Total Teach = ${res.data.length}\n\n👑 | List of Teachers of baby\n${output}`, event.threadID, event.messageID);
      } else {
        const respo = await axios.get(`${link}?list=all`);
        return api.sendMessage(`Total Teach = ${respo.data.length}`, event.threadID, event.messageID);
      }
    }

    if (args[0] === 'msg' || args[0] === 'message') {
      const fuk = dipto.replace("msg ", "");
      const respo = await axios.get(`${link}?list=${fuk}`);
      return api.sendMessage(`Message ${fuk} = ${respo.data.data}`, event.threadID, event.messageID);
    }

    // Default: send message to API and reply
    const a = (await axios.get(`${link}?text=${encodeURIComponent(dipto)}&senderID=${uid}&font=1`)).data.reply;
    return api.sendMessage(a, event.threadID,
        (error, info) => {
          global.client.handleReply.push({
            name: this.config.name,
            type: "reply",
            messageID: info.messageID,
            author: event.senderID,
            lnk: a,
            apiUrl: link
          });
        }, event.messageID);

  } catch (e) {
    console.error('Error in command execution:', e);
    return api.sendMessage(`Error: ${e.message}`, event.threadID, event.messageID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
try{
  if (event.type == "message_reply") {
    const reply = event.body.toLowerCase();
    const b = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(reply)}&senderID=${event.senderID}&font=1`)).data.reply;
    await api.sendMessage(b, event.threadID, (error, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          type: "reply",
          messageID: info.messageID,
          author: event.senderID,
          lnk: b
        });
      }, event.messageID,
    );
  }
}catch(err){
    return api.sendMessage(`Error: ${err.message}`, event.threadID, event.messageID);
}};

module.exports.handleEvent = async function ({ api, event }) {
try{
   const body = event.body ? event.body?.toLowerCase() : "";
   // Extended trigger words
   const triggers = [
     "baby", "bby", "bot", "jan", "babu", "janu", "babu", "bbu", "bbz", "জান", "জানু", "বেবি", "বেব"," বট","মাকিমা","makima"
   ];
   const found = triggers.find(word => body.startsWith(word));
   if (found) {
      const arr = body.replace(/^\S+\s*/, "");
      // if just trigger word, send random
      if (!arr) {
        // At least 5+ random replies
        const randomReplies = [
          "✨ 𝗬𝗲𝘀 😄, 𝗕𝗼𝗹𝗼 𝗕𝗯𝘇 💋",
          "💬 𝗧𝗺𝗿 𝗣𝗼𝗼𝗸𝗶𝗲 𝗸𝗶 𝗰𝗵𝗲𝗸𝗮 𝗱𝗶𝘀𝗲 🥸\n🗣️ “𝗝𝗲 𝗮𝗺𝗮𝗸𝗲 𝗱𝗮𝗸𝗼...” 😼",
          "🐾 𝗕𝗼𝗹𝗼 𝗰𝘂𝘁𝗲𝗲 𝗽𝗮𝗶𝗯 😻",
          "🙄 𝗔𝗺𝗮𝗸𝗲 𝗻𝗮 𝗱𝗲𝗸𝗲...\n🕵️‍♂️ 𝗔𝗺𝗮𝗿 𝗕𝗼𝘀𝘀 𝗧𝗼𝗵𝗶𝗱𝘂𝗹 𝗲𝗿 𝗶𝗻𝗯𝗼𝘅 𝗲 𝗷𝗮𝘄 😒\n🔗 m.me/mdtohidulislam063",
          "❌ 𝗥𝗲𝗷𝗲𝗰𝘁𝗲𝗱 😏😎\n🚫 𝗡𝗼 𝗰𝗵𝗮𝗻𝗰𝗲 𝗯𝗮𝗯𝘆!",
          "👑 𝗞𝗮𝘄𝗿𝗲 𝗽𝗮𝘁𝘁𝗮 𝗱𝗶𝗺𝘂 𝗻𝗮 😎\n🛍️ 𝗞𝗮𝗿𝗼𝗻 𝗙𝗮𝗶𝗿 & 𝗟𝗶𝘃𝗲𝗹𝘆 𝗸𝗶𝗻𝗰𝗵𝗶 😏💅",
          "🧠 𝗧𝘂𝗺𝗶 𝘁𝗼 𝘀𝗲𝗶 𝗽𝗮𝗴𝗼𝗹 𝘁𝗮 𝗻𝗮 🤔\n😹 𝗖𝗵𝗶𝗻𝘁𝗲𝗶 𝗽𝗮𝗿𝗰𝗵𝗶!",
          "📵 𝗕𝗲𝘀𝗶 𝗱𝗮𝗸𝗹𝗲 𝗹𝗲𝗮𝘃𝗲 𝗻𝗶𝗺𝗨 ☹\n😴 𝗗𝗼 𝗻𝗼𝘁 𝗱𝗶𝘀𝘁𝘂𝗿𝗯!",
          "🙉 𝗦𝘂𝗻𝗺𝘂 𝗻𝗮 𝘁𝗺𝗶...\n💔 𝗧𝘂𝗺𝗶 𝗮𝗺𝗮𝗸𝗲 𝗳𝗿𝗲𝗺 𝗸𝗼𝗿𝗮𝗶 𝗱𝗲𝗼 𝗻𝗮𝗶 🫤",
          "🫣 𝗔𝗰𝗰𝗵𝗮 𝗵𝗮𝗶𝗻... 𝗠𝗮𝗶𝗻 𝗮𝗻𝗱𝗵𝗮 𝗵𝘂𝘂𝗻 😭\n🕳️ 𝗧𝗼𝗸𝗲 𝗱𝗲𝗸𝗵𝗶 𝗻𝗮𝗶..."
        ];

        await api.sendMessage(randomReplies[Math.floor(Math.random() * randomReplies.length)], event.threadID, (error, info) => {
          global.client.handleReply.push({
            name: this.config.name,
            type: "reply",
            messageID: info.messageID,
            author: event.senderID
          });
        }, event.messageID);
        return;
      }
      // If more text after trigger, send to API
      const a = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(arr)}&senderID=${event.senderID}&font=1`)).data.reply;     
      await api.sendMessage(a, event.threadID, (error, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          type: "reply",
          messageID: info.messageID,
          author: event.senderID,
          lnk: a
        });
      }, event.messageID);
   }
}catch(err){
    return api.sendMessage(`Error: ${err.message}`, event.threadID, event.messageID);
}};
