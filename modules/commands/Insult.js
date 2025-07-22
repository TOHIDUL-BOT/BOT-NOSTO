module.exports.config = {
  name: "insult",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "TOHI-BOT-HUB + CopilotX",
  description: "কাউকে mention বা reply দিয়ে insult করো (owner insult block করা থাকবে)",
  usePrefix: true,
  commandCategory: "fun",
  usages: "[@mention/reply]",
  cooldowns: 4
};

const ownerUid = "100092006324917"; // এখানে তোমার UID দাও

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, mentions, type, senderID } = event;

  // ৫০টা একদম ভিন্ন insult sms (বাংলা/ইংরেজি মিশ্রণে)
  const insults = [
    "তুমি কি expired SIM? কারো সাথে কানেক্ট হতে পারো না।",
    "তুমি কি ভুল password? কোথাও access নাই।",
    "তুমি কি broken pen? কেউ তোমাকে দিয়ে লিখতে চায় না।",
    "তুমি কি buffering video? সবাই তোমাকে skip করতে চায়।",
    "তুমি কি traffic jam? সবাই তোমাকে avoid করে।",
    "তুমি কি ghost call? কেউ ধরতে চায় না।",
    "তুমি কি old meme? কেউ আর interest নেয় না।",
    "তুমি কি mosquito coil? সবাই তোমাকে এড়িয়ে চলে।",
    "তুমি কি boring movie? কেউ শেষ পর্যন্ত দেখে না।",
    "তুমি কি flat soda? কোনো taste নেই।",
    "তুমি কি যন্ত্রণা? সবাই তোমাকে mute করতে চায়।",
    "তুমি কি broken charger? কেউ চার্জ পায় না।",
    "তুমি কি rejected friend request? কেউ accept করে না।",
    "তুমি কি old news? কেউ পড়ে না।",
    "তুমি কি broken stapler? কোনো কাজেই আসো না।",
    "তুমি কি useless bookmark? কেউ খোলে না।",
    "তুমি কি cracked screen? কেউ তোমার দিকে তাকাতে চায় না।",
    "তুমি কি loading icon? সবাই তোমাকে skip করতে চায়।",
    "তুমি কি blank paper? কেউ inspiration পায় না।",
    "তুমি কি missed call? কেউ ফিরতি call দেয় না।",
    "তুমি কি lost charger? সবাই খুঁজে খুঁজে ক্লান্ত।",
    "তুমি কি ভুলে যাওয়ার যন্ত্র? তোমাকে কেউ মনে রাখে না।",
    "তুমি কি পুরনো diary? কেউ আর পড়ে না।",
    "তুমি কি spam mail? দরকার ছাড়া কেউ খোলে না।",
    "তুমি কি broken toy? কারো কোনো কাজে আসো না।",
    "তুমি কি useless app? সবাই uninstall করতে চায়।",
    "তুমি কি empty fridge? আশা আছে, কিছু নেই।",
    "তুমি কি faded jeans? সবাই নতুন পরে।",
    "তুমি কি broken umbrella? বৃষ্টিতে কারো কাজে আসো না।",
    "তুমি কি missed bus? সবাই দৌড়ায়, তবুও miss করো।",
    "তুমি কি broken clock? সব সময় ভুল দেখাও।",
    "তুমি কি dry marker? কেউ লিখতে পারে না।",
    "You’re as useless as the 'g' in lasagna.",
    "You have the charisma of a soggy towel.",
    "If stupidity was a sport, you’d be a world champion.",
    "If I wanted to hear from someone useless, I’d talk to you.",
    "You’re proof evolution can go in reverse.",
    "You’re the reason shampoo has instructions.",
    "If I wanted a joke, I’d look at your life.",
    "Your secrets are safe with me, because I never listen.",
    "If you were any slower, you’d be going backward.",
    "If ignorance is bliss, you must be the happiest person alive.",
    "Your brain is like a web browser: too many tabs open, nothing working.",
    "You bring everyone so much joy… when you leave the room.",
    "You have the personality of a dry sponge.",
    "You’re like a cloud. When you disappear, it’s a beautiful day.",
    "You’re not stupid, you just have bad luck thinking.",
    "You must be a magician, because every time I look at you, everyone else disappears.",
    "You’re the human version of a typo."
  ];

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  let target, targetName;
  // Mention-check
  if (Object.keys(mentions).length) {
    target = Object.keys(mentions)[0];
    targetName = mentions[target].replace(/@/g, "");
  }
  // Reply-check
  else if (type === "message_reply") {
    target = event.messageReply.senderID;
    targetName = event.messageReply.body?.split(" ")[0] || "বন্ধু";
  }
  // Fallback: insult self
  else {
    target = senderID;
    targetName = "তুমি";
  }

  // Owner-কে insult করা যাবে না
  if (target === ownerUid) {
    return api.sendMessage("🤖 বট owner-কে insult করা যাবে না! 😎", threadID, messageID);
  }

  const insult = pickRandom(insults);

  // If insult self, don't mention
  if (target === senderID) {
    return api.sendMessage(`${insult}`, threadID, messageID);
  } else {
    return api.sendMessage({
      body: `@${targetName},\n${insult}`,
      mentions: [{
        tag: `@${targetName}`,
        id: target
      }]
    }, threadID, messageID);
  }
};
