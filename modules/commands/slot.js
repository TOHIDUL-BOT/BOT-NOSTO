module.exports.config = {
  name: "slot",
  version: "2.0.0",
  permission: 0,
  credits: "TOHI-BOT-HUB",
  usePrefix: true,
  description: "slot game",
  commandCategory: "game",
  usages: "slot (amount)",
  cooldowns: 5
};

module.exports.languages = {
  en: {
    missingInput: "The bet money must not be blank or a negative number.",
    moneyBetNotEnough: "The money you bet is bigger than your balance.",
    limitBet: "Your bet is too low, the minimum is 50.",
    returnWin: "🎰 %1 | %2 | %3 🎰\nYou won %4$!",
    returnLose: "🎰 %1 | %2 | %3 🎰\nYou lost %4$!"
  },
  bd: {
    missingInput: "বাজির টাকা খালি বা নেতিবাচক সংখ্যা হতে পারে না।",
    moneyBetNotEnough: "আপনার বাজির টাকা আপনার ব্যালেন্সের চেয়ে বেশি।",
    limitBet: "আপনার বাজি খুব কম, সর্বনিম্ন ৫০ টাকা।",
    returnWin: "🎰 %1 | %2 | %3 🎰\nআপনি %4$ জিতেছেন!",
    returnLose: "🎰 %1 | %2 | %3 🎰\nআপনি %4$ হেরেছেন!"
  }
};

function getText(lang, key, ...args) {
  let text = (module.exports.languages[lang] && module.exports.languages[lang][key]) || module.exports.languages["en"][key] || key;
  args.forEach((v, i) => text = text.replace(`%${i + 1}`, v));
  return text;
}

module.exports.run = async function({ api, event, args, Currencies, getText: getTextByEnv }) {
  const lang = global.config.language && module.exports.languages[global.config.language] ? global.config.language : "en";
  const { threadID, messageID, senderID } = event;
  const { getData, increaseMoney, decreaseMoney } = Currencies;

  // Bet validation
  const moneyBet = parseInt(args[0]);
  if (isNaN(moneyBet) || moneyBet <= 0)
    return api.sendMessage(getText(lang, "missingInput"), threadID, messageID);

  const userData = await getData(senderID);
  if (moneyBet > userData.money)
    return api.sendMessage(getText(lang, "moneyBetNotEnough"), threadID, messageID);

  if (moneyBet < 50)
    return api.sendMessage(getText(lang, "limitBet"), threadID, messageID);

  // Slot logic
  const slotItems = ["🍒", "🍋", "🍇", "🍉", "🍀", "⭐", "7️⃣", "🍓", "🍌", "🥝", "🥑", "🌽"];
  const numbers = [0, 0, 0].map(() => Math.floor(Math.random() * slotItems.length));
  const [a, b, c] = numbers.map(i => slotItems[i]);

  let win = false, reward = moneyBet;
  if (numbers[0] === numbers[1] && numbers[1] === numbers[2]) {
    reward *= 9; win = true;
  } else if (numbers[0] === numbers[1] || numbers[0] === numbers[2] || numbers[1] === numbers[2]) {
    reward *= 2; win = true;
  }

  if (win) {
    await increaseMoney(senderID, reward);
    return api.sendMessage(getText(lang, "returnWin", a, b, c, reward), threadID, messageID);
  } else {
    await decreaseMoney(senderID, moneyBet);
    return api.sendMessage(getText(lang, "returnLose", a, b, c, moneyBet), threadID, messageID);
  }
};