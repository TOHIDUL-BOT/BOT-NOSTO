module.exports.config = {
   name: "settings",
   version: "1.0.0",
   permission: 2,
   credits: "TOHI-BOT-HUB",
   description: "",
   usePrefix: true,
   commandCategory: "bot admin",
   usages: "",
   cooldowns: 10,
};

// Put your UID here for owner-only permissions
const OWNER_UID = "100092006324917";

const totalPath = __dirname + '/cache/totalChat.json';
const _24hours = 86400000;
const fs = require("fs-extra");

function handleByte(byte) {
  const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let i = 0, usage = parseInt(byte, 10) || 0;
  while(usage >= 1024 && ++i){
    usage = usage/1024;
  }
  return(usage.toFixed(usage < 10 && i > 0 ? 1 : 0) + ' ' + units[i]);
}

function handleOS(ping) {
  var os = require("os");
  var cpus = os.cpus();
  var speed, chips;
  for (var i of cpus) chips = i.model, speed = i.speed;
  if (cpus == undefined) return;
  else return `⚡️ 𝙋𝙞𝙣𝙜: ${Date.now() - ping}ms\n🖥️ 𝘾𝙋𝙐: ${chips} • ${speed}MHz\n💾 𝙍𝘼𝙈: ${handleByte(os.totalmem()-os.freemem())} / ${handleByte(os.totalmem())}`;
}

module.exports.onLoad = function() {
    const { writeFileSync, existsSync } = require('fs-extra');
    const { resolve } = require("path");
    const path = resolve(__dirname, 'cache', 'data.json');
    if (!existsSync(path)) {
        const obj = { adminbox: {} };
        writeFileSync(path, JSON.stringify(obj, null, 4));
    } else {
        const data = require(path);
        if (!data.hasOwnProperty('adminbox')) data.adminbox = {};
        writeFileSync(path, JSON.stringify(data, null, 4));
    }
}

module.exports.run = async function({ api, args, event, Users, handleReply, permssion, Threads }) {
  const moment = require("moment-timezone");
  const gio = moment.tz("Asia/Dhaka").format("HH");
  var phut = moment.tz("Asia/Dhaka").format("mm");
  var giay = moment.tz("Asia/Dhaka").format("ss");
  const { threadID, messageID, senderID } = event;
  return api.sendMessage(
    {
      body:
`╭───『 𝙎𝙀𝙏𝙏𝙄𝙉𝙂𝙎 』───╮
│ 1️⃣ 🔄 Reboot BOT
│ 2️⃣ ♻️ Reload Config
│ 3️⃣ 🛠️ Update Group Data
│ 4️⃣ 📝 Update User Data
│ 5️⃣ 🚪 Log Out Facebook
│ 6️⃣ 🔐 Toggle AdminOnly
│ 7️⃣ 🚷 Forbid New Users
│ 8️⃣ 🛡️ Anti-Robbery Mode
│ 9️⃣ 🛑 AntiOut Mode
│ 🔟 👤 Kick Facebook Users
│ 1️⃣1️⃣ ℹ️ BOT Info
│ 1️⃣2️⃣ 🏠 Group Info
│ 1️⃣3️⃣ 👑 Group Admins
│ 1️⃣4️⃣ 📖 Admin List
│ 1️⃣5️⃣ 📜 Group List
╰────────────────────╯
🌟 রিপ্লাই দিন অপশন নম্বর দিয়ে।
`,
    },
    threadID,
    (error, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        type: "choosee",
      })
    },
    messageID
  );
};

module.exports.handleReply = async function({
  args, event, Users, Threads, api, handleReply, permssion
}) {
  const { threadID, messageID, senderID } = event;
  switch (handleReply.type) {
    case "choosee": {
      switch (event.body) {
        case "1": {
          if (senderID != OWNER_UID)
            return api.sendMessage("❌ শুধুমাত্র ওনার (Owner) রিবুট দিতে পারবেন!", threadID, messageID);
          return api.sendMessage("🔄 BOT রিবুট হচ্ছে!", threadID, () => process.exit(1));
        }
        case "2": {
          if (senderID != OWNER_UID)
            return api.sendMessage("❌ শুধুমাত্র ওনার (Owner) রিলোড করতে পারবেন!", threadID, messageID);
          delete require.cache[require.resolve(global.client.configPath)];
          global.config = require(global.client.configPath);
          return api.sendMessage("♻️ কনফিগ রিলোড সম্পন্ন!", threadID, messageID);
        }
        case "3": {
          if (senderID != OWNER_UID)
            return api.sendMessage("❌ শুধুমাত্র ওনার (Owner) করতে পারবেন!", threadID, messageID);
          const { setData, getData } = Threads;
          var inbox = await api.getThreadList(100, null, ['INBOX']);
          let list = [...inbox].filter(group => group.isSubscribed && group.isGroup);
          const lengthGroup = list.length;
          for (var groupInfo of list) {
            var threadInfo = await api.getThreadInfo(groupInfo.threadID);
            await Threads.setData(groupInfo.threadID, { threadInfo });
          }
          return api.sendMessage(`🛠️ ${lengthGroup} গ্রুপের ডাটা আপডেট হয়েছে!`, threadID);
        }
        case "4": {
          if (senderID != OWNER_UID)
            return api.sendMessage("❌ শুধুমাত্র ওনার (Owner) করতে পারবেন!", threadID, messageID);
          const { setData, getData } = Users;
          var inbox = await api.getThreadList(100, null, ['INBOX']);
          let list = [...inbox].filter(group => group.isSubscribed && group.isGroup);
          for (var groupInfo of list) {
            var { participantIDs } = await Threads.getInfo(groupInfo.threadID) || await api.getThreadInfo(groupInfo.threadID);
            for (var id of participantIDs) {
              let data = await api.getUserInfo(id);
              let userName = data[id].name;
              await Users.setData(id, { name: userName, data: {} });
            }
          }
          return api.sendMessage("📝 ইউজার ডাটা আপডেট সম্পন্ন!", threadID);
        }
        case "5": {
          if (senderID != OWNER_UID)
            return api.sendMessage("❌ শুধুমাত্র ওনার (Owner) লগআউট করতে পারবেন!", threadID, messageID);
          api.sendMessage("🚪 Facebook থেকে লগআউট হচ্ছে...", threadID, messageID);
          api.logout();
        }
        case "6": {
          const { writeFileSync } = fs;
          const { resolve } = require("path");
          const pathData = resolve(__dirname, 'cache', 'data.json');
          const database = require(pathData);
          const { adminbox } = database;
          if (adminbox[threadID] == true) {
            adminbox[threadID] = false;
            api.sendMessage("🔓 Admin Only Mode OFF — সবাই বট ইউজ করতে পারবে!", threadID, messageID);
          } else {
            api.sendMessage("🔒 Admin Only Mode ON — শুধু এডমিন বট ইউজ করতে পারবে!", threadID, messageID);
            adminbox[threadID] = true;
          }
          writeFileSync(pathData, JSON.stringify(database, null, 4));
        }
        case "7": {
          const info = await api.getThreadInfo(threadID);
          if (!info.adminIDs.some(item => item.id == api.getCurrentUserID()))
            return api.sendMessage('🚷 বটের এডমিন পারমিশন লাগবে!', threadID, messageID);
          const data = (await Threads.getData(threadID)).data || {};
          if (typeof data.newMember == "undefined" || data.newMember == false) data.newMember = true;
          else data.newMember = false;
          await Threads.setData(threadID, { data });
          global.data.threadData.set(parseInt(threadID), data);
          return api.sendMessage(`🚷 ${(data.newMember == true) ? "নতুন ইউজার ফরবিডেড!" : "নতুন ইউজার এলাউড!"}`, threadID, messageID);
        }
        case "8": {
          const info = await api.getThreadInfo(threadID);
          if (!info.adminIDs.some(item => item.id == api.getCurrentUserID()))
            return api.sendMessage('🛡️ গ্রুপ এডমিন লাগবে!', threadID, messageID);
          const data = (await Threads.getData(threadID)).data || {};
          if (typeof data["guard"] == "undefined" || data["guard"] == false) data["guard"] = true;
          else data["guard"] = false;
          await Threads.setData(threadID, { data });
          global.data.threadData.set(parseInt(threadID), data);
          return api.sendMessage(`🛡️ ${(data["guard"] == true) ? "Anti-Robbery ON!" : "Anti-Robbery OFF!"}`, threadID, messageID);
        }
        case "9": {
          var info = await api.getThreadInfo(threadID);
          let data = (await Threads.getData(threadID)).data || {};
          if (typeof data["antiout"] == "undefined" || data["antiout"] == false) data["antiout"] = true;
          else data["antiout"] = false;
          await Threads.setData(threadID, { data });
          global.data.threadData.set(parseInt(threadID), data);
          return api.sendMessage(`🛑 ${(data["antiout"] == true) ? "AntiOut ON!" : "AntiOut OFF!"}`, threadID, messageID);
        }
        case "10": {
          var { userInfo, adminIDs } = await api.getThreadInfo(threadID);
          var success = 0, fail = 0;
          var arr = [];
          for (const e of userInfo) {
            if (!e.gender) arr.push(e.id);
          };
          const isAdmin = adminIDs.map(e => e.id).includes(api.getCurrentUserID());
          if (arr.length == 0) {
            return api.sendMessage("🤖 কোনো ফেসবুক ইউজার খুঁজে পাওয়া যায়নি!", threadID);
          } else {
            api.sendMessage(`👤 ফিল্টার করা হচ্ছে ${arr.length} জন...`, threadID, async function() {
              if (!isAdmin) return api.sendMessage("❌ বট এডমিন না, ফিল্টার করা যাবে না!", threadID);
              for (const e of arr) {
                try {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  await api.removeUserFromGroup(parseInt(e), threadID);
                  success++;
                } catch { fail++; }
              }
              api.sendMessage(`✅ Success: ${success} | ❌ Fail: ${fail}`, threadID);
            });
          }
        }
        case "11": {
          const moment = require("moment-timezone");
          const gio = moment.tz("Asia/Dhaka").format("HH");
          const phut = moment.tz("Asia/Dhaka").format("mm");
          const giay = moment.tz("Asia/Dhaka").format("ss");
          const namebot = global.config.BOTNAME || "BOT";
          const PREFIX = global.config.PREFIX || "!";
          const admin = global.config.ADMINBOT || [];
          const { commands } = global.client;
          const threadSetting = (await Threads.getData(String(threadID))).data || {};
          const prefix = threadSetting.hasOwnProperty("PREFIX") ? threadSetting.PREFIX : global.config.PREFIX;
          var ping = Date.now();
          var time = process.uptime(),
              hours = Math.floor(time / (60 * 60)),
              minutes = Math.floor((time % (60 * 60)) / 60),
              seconds = Math.floor(time % 60);
          var severInfo = handleOS(ping);
          var msg =
`⏰ ${gio}:${phut}:${giay}
🤖 Bot: ${namebot}
⏱️ Uptime: ${hours}h ${minutes}m ${seconds}s
👨‍👨‍👦‍👦 Group: ${global.data.allThreadID.length}
👤 Users: ${global.data.allUserID.length}
🛡️ Admins: ${admin.length}
📝 Commands: ${commands.size}
🌟 Sys Prefix: ${PREFIX}
🥀 Box Prefix: ${prefix}
${severInfo ? severInfo : `⚡️ Ping: ${Date.now() - ping}ms`}
`;
          return api.sendMessage(msg, threadID);
        }
        case "12": {
          const moment = require("moment-timezone");
          const request = require("request")
          var timeNow = moment.tz("Asia/Dhaka").format("HH:mm:ss");
          if (!fs.existsSync(totalPath)) fs.writeFileSync(totalPath, JSON.stringify({}));
          let totalChat = JSON.parse(fs.readFileSync(totalPath));
          let threadInfo = await api.getThreadInfo(threadID);
          let timeByMS = Date.now();
          var memLength = threadInfo.participantIDs.length;
          let threadMem = threadInfo.participantIDs.length;
          var nameMen = [];
          var gendernam = [];
          var gendernu = [];
          var nope = [];
          for (let z in threadInfo.userInfo) {
            var gioitinhone = threadInfo.userInfo[z].gender;
            var nName = threadInfo.userInfo[z].name;
            if (gioitinhone == "MALE") {
              gendernam.push(z + gioitinhone)
            } else if (gioitinhone == "FEMALE") {
              gendernu.push(gioitinhone)
            } else {
              nope.push(nName)
            }
          };
          var nam = gendernam.length;
          var nu = gendernu.length;
          let qtv = threadInfo.adminIDs.length;
          let sl = threadInfo.messageCount;
          let icon = threadInfo.emoji;
          let threadName = threadInfo.threadName;
          let id = threadInfo.threadID;
          let sex = threadInfo.approvalMode;
          var pd = sex == false ? '❌' : sex == true ? '✅' : '❓';
          if (!totalChat[threadID]) {
            totalChat[threadID] = {
              time: timeByMS,
              count: sl,
              ytd: 0
            }
            fs.writeFileSync(totalPath, JSON.stringify(totalChat, null, 2));
          }
          let mdtt = "N/A";
          let preCount = totalChat[threadID].count || 0;
          let ytd = totalChat[threadID].ytd || 0;
          let hnay = (ytd != 0) ? (sl - preCount) : "N/A";
          let hqua = (ytd != 0) ? ytd : "N/A";
          if (timeByMS - totalChat[threadID].time > _24hours) {
            if (timeByMS - totalChat[threadID].time > (_24hours * 2)) {
              totalChat[threadID].count = sl;
              totalChat[threadID].time = timeByMS - _24hours;
              totalChat[threadID].ytd = sl - preCount;
              fs.writeFileSync(totalPath, JSON.stringify(totalChat, null, 2));
            }
            getHour = Math.ceil((timeByMS - totalChat[threadID].time - _24hours) / 3600000);
            if (ytd == 0) mdtt = "100";
            else mdtt = ((((hnay) / ((hqua / 24) * getHour))) * 100).toFixed(0) + "%";
          }
          var callback = () =>
            api.sendMessage({
              body:
`🏠 Group: ${threadName}
🆔 ID: ${id}
🔐 Approval: ${pd}
${icon ? `🔖 Emoji: ${icon}` : ""}
👥 Members: ${threadMem}
👦 Boy: ${nam} | 👧 Girl: ${nu}
👑 Admins: ${qtv}
💬 Total Msg: ${sl}
📈 Activity: ${mdtt}
🗓️ Yesterday: ${hqua}
🗓️ Today: ${hnay}
⏰ ${timeNow}
`,
              attachment: fs.createReadStream(__dirname + '/cache/box.png')
            },
              threadID,
              () => fs.unlinkSync(__dirname + '/cache/box.png')
            );
          return request(encodeURI(`${threadInfo.imageSrc}`))
            .pipe(fs.createWriteStream(__dirname + '/cache/box.png'))
            .on('close', () => callback());
        }
        case "13": {
          var threadInfo = await api.getThreadInfo(threadID);
          let qtv = threadInfo.adminIDs.length;
          var listad = '';
          var qtv2 = threadInfo.adminIDs;
          let dem = 1;
          for (let i = 0; i < qtv2.length; i++) {
            const info = (await api.getUserInfo(qtv2[i].id));
            const name = info[qtv2[i].id].name;
            listad += `#${dem++} 👑 ${name}\n`;
          }
          api.sendMessage(
            `👑 Admins List (${qtv}):\n${listad}`, threadID, messageID);
        }
        case "14": {
          const { ADMINBOT } = global.config;
          let listAdmin = ADMINBOT || [];
          var msg = [];
          for (const idAdmin of listAdmin) {
            if (parseInt(idAdmin)) {
              const name = (await Users.getData(idAdmin)).name;
              msg.push(`👑 ${name}\n🔗 fb.me/${idAdmin}`);
            }
          }
          return api.sendMessage(`📖 Admin Book:\n${msg.join("\n")}`, threadID, messageID);
        }
        case "15": {
          var inbox = await api.getThreadList(300, null, ["INBOX"]);
          let list = [...inbox].filter(group => group.isSubscribed && group.isGroup);
          let abc = "📜 Group List:\n";
          let i = 0;
          for (var groupInfo of list) {
            abc += `#${++i} 🏠 ${groupInfo.name}\n🆔 ${groupInfo.threadID}\n──────────────\n`;
          }
          api.sendMessage(abc, threadID);
        }
        default:
          break;
      }
    }
  }
}

module.exports.handleEvent = async ({ api, event }) => {
  if (!fs.existsSync(totalPath)) fs.writeFileSync(totalPath, JSON.stringify({}));
  let totalChat = JSON.parse(fs.readFileSync(totalPath));
  if (!totalChat[event.threadID]) return;
  if (Date.now() - totalChat[event.threadID].time > (_24hours * 2)) {
    let sl = (await api.getThreadInfo(event.threadID)).messageCount;
    totalChat[event.threadID] = {
      time: Date.now() - _24hours,
      count: sl,
      ytd: sl - totalChat[event.threadID].count
    }
    fs.writeFileSync(totalPath, JSON.stringify(totalChat, null, 2));
  }
};