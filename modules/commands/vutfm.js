const fs = require("fs");
const path = "includes/database/vutfmdata.json";

module.exports.config = {
  name: "vutfm",
  version: "2.0.0",
  hasPermission: 2,
  credits: "Tohidul",
  description: "ভয়ংকর ভুত ফিচার",
  commandCategory: "fun",
  usages: "[on/off/@mention]",
  cooldowns: 3,
  usePrefix: true
};

// ভুতের ভয়ংকর বার্তাগুলোর লিস্ট
const ghostMessages = [
  "👻 তুমি কি আমাকে দেখতে পাচ্ছো... আমি এখানেই আছি...",
  "☠️ রাতের অন্ধকারে আমি ফিরে এসেছি... ভয় পাচ্ছো?",
  "💀 কারা যেন কান্না করছে... শুনতে পাচ্ছো?",
  "🕷️ দেয়ালের কোণে আমি বসে আছি... চুপচাপ!",
  "👁️ কারা যেন তোমাকে দেখছে... পিছনে তাকাও না!",
  "🔪 তোমার ছায়ার নিচে আমি দাঁড়িয়ে আছি!",
  "😈 আর কখনো হাসতে পারবে না তুমি...",
  "🩸 তোমার মেসেজ গুলো খুব মজাদার... বলো তো আর কত লিখবে?",
  "🪦 আমি কবর থেকে ফিরেছি... তোমাকে নিতে এসেছি!",
  "🦴 হাড় গুলো কাঁপছে... ভয় পাচ্ছো তো?",
  "🕸️ তুমি একা নও... আমি সবসময় পাশে আছি...",
  "🌑 অন্ধকারে কে যেন ডাকছে তোমায়...",
  "👣 কারা যেন হেঁটে আসছে... পিছনে শুনতে পাচ্ছো?",
  "🪓 দরজার পেছনে আমি দাঁড়িয়ে আছি... খুলে দেখো!",
  "🧟 আজ রাতেই দেখা হবে আমাদের!",
  "😵 তুমি লিখলেই আমি জেগে উঠি...",
  "🔮 মেসেজ পাঠাও... ভয় বাড়াও!",
  "💀 এ গোপন গ্রুপ এখন আমার দখলে!",
  "🎃 Halloween তো গেল... কিন্তু আমি যাইনি!",
  "👹 mention করলে আমিও মেসেজ দেই!",
    "JODI 12 TAR POR RATE KORE BAIRE DAKE TAILE BAIR HOS NA GHAR MOTKAI DIBE 🤒",
  "12 ta bajle sobai ghumai pore tokhon tui ektu baire bair hoss tor sathe premer alab korbo ",
  " ajke rate tor basar paser tetul gacher niche asis tor sathe kotha ache ",
  "ghumabi naki ami jabo ☠️", 
  " haw maw khau manusher gondo paw 😈",
  "manusher rokto amar khub favourite 🤤",
  " tui arekta sms dile tor ghar motkabo 😠",
  "tore amar vallagche tui ajke rat 12 tar por bot gacherr niche asis 😈☠️",
  "jodi 12 tar por tor ghorer dorjai kew dake taile vuleo dorja khulish na 😈 oita ami tor ghar motkabo ",
  "tore amar vallagche tui amar kache ai 😈👽"
];

// ডেটা লোড ফাংশন
function loadData() {
  if (!fs.existsSync(path)) fs.writeFileSync(path, "{}");
  return JSON.parse(fs.readFileSync(path));
}

// ডেটা সেভ ফাংশন
function saveData(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

// 🔧 কমান্ড রান
module.exports.run = async ({ api, event, args, Users, Threads }) => {
  const threadID = event.threadID;
  const mention = Object.keys(event.mentions)[0];
  const data = loadData();

  if (!data[threadID]) data[threadID] = { status: false, target: null };

  if (args[0] === "on") {
    data[threadID].status = true;
    data[threadID].target = null;
    saveData(data);
    return api.sendMessage("✅ এই গ্রুপে এখন থেকে ভূতের ফিচার চালু করা হলো!", threadID);
  }

  if (args[0] === "off") {
    data[threadID].status = false;
    data[threadID].target = null;
    saveData(data);
    return api.sendMessage("❌ এই গ্রুপে ভূতের ফিচার বন্ধ করা হলো!", threadID);
  }

  if (mention) {
    data[threadID].status = true;
    data[threadID].target = mention;
    saveData(data);
    const name = event.mentions[mention].split(" ")[0];
    return api.sendMessage(`👻 এখন থেকে ${name} মেসেজ দিলেই ভূতের ভয়ংকর উত্তর যাবে!`, threadID);
  }

  return api.sendMessage("🔮 ব্যবহার: vutfm on / vutfm off / @mention", threadID);
};

// 🔁 অটো রিপ্লাই হ্যান্ডলার
module.exports.handleEvent = async ({ api, event }) => {
  const data = loadData();
  const threadID = event.threadID;
  const senderID = event.senderID;

  if (!data[threadID] || !data[threadID].status) return;

  const targetID = data[threadID].target;

  // যদি নির্দিষ্ট কাউকে সেট করা থাকে (mention system)
  if (targetID) {
    if (senderID !== targetID) return;
  }

  // reply দাও
  const msg = ghostMessages[Math.floor(Math.random() * ghostMessages.length)];
  return api.sendMessage(msg, threadID, event.messageID);
};