const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports.config = {
  name: "pair",
  version: "3.1.1",
  hasPermission: 0,
  credits: "Tohidul 🖤, modified by Grok",
  description: "Make a love pair with the command issuer and a random opposite gender member",
  commandCategory: "fun",
  usages: "pair",
  cooldowns: 5,
  usePrefix: true
};

module.exports.run = async function ({ api, event, Users }) {
  try {
    const threadInfo = await api.getThreadInfo(event.threadID);
    const senderID = event.senderID;
    const senderInfo = threadInfo.userInfo.find(u => u.id == senderID);
    
    if (!senderInfo) return api.sendMessage("❌ আপনার তথ্য পাওয়া যায়নি!", event.threadID);

    const senderGender = senderInfo.gender;
    const members = threadInfo.userInfo.filter(u => u.id != api.getCurrentUserID() && u.id != senderID);

    if (members.length < 1) return api.sendMessage("❌ কমপক্ষে একজন বিপরীত লিঙ্গের মেম্বার থাকা প্রয়োজন!", event.threadID);

    const oppositeGenderMembers = members.filter(m => m.gender !== senderGender && (m.gender === "MALE" || m.gender === "FEMALE"));

    if (oppositeGenderMembers.length === 0)
      return api.sendMessage("❌ বিপরীত লিঙ্গের কোনো মেম্বার পাওয়া যায়নি!", event.threadID);

    const partner = oppositeGenderMembers[Math.floor(Math.random() * oppositeGenderMembers.length)];

    const senderName = await Users.getNameUser(senderID);
    const partnerName = await Users.getNameUser(partner.id);

    const senderImg = await getAvatar(senderID);
    const partnerImg = await getAvatar(partner.id);

    const collagePath = await makeCollage(senderImg, partnerImg);

    const msg = 
`┏━━━━━━༺💘༻━━━━━━┓
     🥂 𝑳𝒐𝒗𝒆 𝑷𝒂𝒊𝒓 𝑭𝒐𝒓𝒎𝒆𝒅!
┗━━━━━━༺💘༻━━━━━━┛

${senderGender === "MALE" ? "👦🏻 𝑯𝒆" : "👧🏻 𝑺𝒉𝒆"}: ${senderName}
${partner.gender === "MALE" ? "👦🏻 𝑯𝒆" : "👧🏻 𝑺𝒉𝒆"}: ${partnerName}

❤️ PAIR করে দিসি বাকিটা তোমরা সামলাও 🌚।

✨ "𝑪𝒐𝒏𝒈𝒓𝒂𝒕𝒔 𝑪𝒖𝒕𝒆 𝑪𝒐𝒖𝒑𝒍𝒆 💞"

🫧 ভালোবাসা থাকুক চিরদিন`;

    return api.sendMessage({
      body: msg,
      attachment: fs.createReadStream(collagePath),
      mentions: [
        { tag: senderName, id: senderID },
        { tag: partnerName, id: partner.id }
      ]
    }, event.threadID, () => fs.unlinkSync(collagePath));

  } catch (err) {
    console.error(err);
    return api.sendMessage("⚠️ কিছু সমস্যা হয়েছে, পরে আবার চেষ্টা করো!", event.threadID);
  }
};

// === Helper Functions ===
async function getAvatar(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?height=512&width=512&access_token=350685531728|62f8ce9f74b12f84c123cc23437a4a32`;
  const pathImg = path.join(__dirname, `/cache/${uid}.jpg`);
  const res = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(pathImg, Buffer.from(res.data, "utf-8"));
  return pathImg;
}

async function makeCollage(imgPath1, imgPath2) {
  const img1 = await jimp.read(imgPath1);
  const img2 = await jimp.read(imgPath2);

  // Resize for 3x3 inch (300 DPI = 900x900 px)
  img1.resize(900, 900);
  img2.resize(900, 900);

  const width = img1.getWidth() + img2.getWidth();
  const height = Math.max(img1.getHeight(), img2.getHeight());

  const collage = new jimp(width, height);
  collage.composite(img1, 0, 0);
  collage.composite(img2, img1.getWidth(), 0);

  const outPath = path.join(__dirname, `/cache/pair_collage_${Date.now()}.jpg`);
  await collage.writeAsync(outPath);

  fs.unlinkSync(imgPath1);
  fs.unlinkSync(imgPath2);

  return outPath;
}