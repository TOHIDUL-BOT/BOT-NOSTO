
const os = require('os');
const fs = require('fs-extra');

module.exports.config = {
  name: "deviceinfo",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "TOHI-BOT-HUB",
  description: "Send detailed device information to admin inbox",
  commandCategory: "BOT ADMIN",
  usages: "deviceinfo",
  usePrefix: true,
  cooldowns: 10,
  aliases: ["dvif", "dvinfo"]
};

module.exports.run = async function({ api, event, Users }) {
  const adminId = global.config.ADMINBOT[0]; // প্রথম এডমিনের ID নিচ্ছি
  
  try {
    // সিস্টেম ইনফরমেশন সংগ্রহ
    const systemInfo = {
      // অপারেটিং সিস্টেম তথ্য
      platform: os.platform(),
      type: os.type(),
      release: os.release(),
      arch: os.arch(),
      
      // CPU তথ্য
      cpus: os.cpus(),
      cpuModel: os.cpus()[0]?.model || 'Unknown',
      cpuCount: os.cpus().length,
      
      // মেমোরি তথ্য
      totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100, // GB তে
      freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024 * 100) / 100, // GB তে
      usedMemory: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024 * 100) / 100, // GB তে
      
      // Node.js তথ্য
      nodeVersion: process.version,
      platform_node: process.platform,
      arch_node: process.arch,
      
      // প্রসেস তথ্য
      pid: process.pid,
      uptime: Math.round(process.uptime()), // সেকেন্ডে
      
      // নেটওয়ার্ক ইন্টারফেস
      networkInterfaces: os.networkInterfaces(),
      
      // হোস্ট তথ্য
      hostname: os.hostname(),
      username: os.userInfo().username,
      homedir: os.userInfo().homedir,
      
      // অন্যান্য
      loadAverage: os.loadavg(),
      endianness: os.endianness(),
      tmpdir: os.tmpdir()
    };

    // IP ঠিকানা খুঁজে বের করা
    let ipAddresses = [];
    Object.keys(systemInfo.networkInterfaces).forEach(interfaceName => {
      systemInfo.networkInterfaces[interfaceName].forEach(iface => {
        if (!iface.internal && iface.family === 'IPv4') {
          ipAddresses.push(`${interfaceName}: ${iface.address}`);
        }
      });
    });

    // আপটাইম ফরম্যাট করা
    const uptimeHours = Math.floor(systemInfo.uptime / 3600);
    const uptimeMinutes = Math.floor((systemInfo.uptime % 3600) / 60);
    const uptimeSeconds = systemInfo.uptime % 60;

    // বট তথ্য
    const botInfo = {
      name: global.config.BOTNAME,
      version: global.config.version || "1.8.0",
      commandCount: global.client.commands.size,
      eventCount: global.client.events.size,
      totalUsers: global.data?.allUserID?.length || 0,
      totalGroups: global.data?.allThreadID?.length || 0
    };

    // বিস্তারিত মেসেজ তৈরি
    const deviceMessage = `
╔══════════════════════════════╗
     🤖 BOT DEVICE INFORMATION 🤖
╚══════════════════════════════╝

📱 BASIC INFO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• হোস্টনেম: ${systemInfo.hostname}
• ইউজারনেম: ${systemInfo.username}
• প্ল্যাটফর্ম: ${systemInfo.platform} (${systemInfo.type})
• আর্কিটেকচার: ${systemInfo.arch}
• OS রিলিজ: ${systemInfo.release}
• Endianness: ${systemInfo.endianness}

💻 CPU INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• মডেল: ${systemInfo.cpuModel}
• কোর সংখ্যা: ${systemInfo.cpuCount}
• Load Average: [${systemInfo.loadAverage.map(avg => avg.toFixed(2)).join(', ')}]

🧠 MEMORY INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• মোট র‍্যাম: ${systemInfo.totalMemory} GB
• ব্যবহৃত র‍্যাম: ${systemInfo.usedMemory} GB
• ফ্রি র‍্যাম: ${systemInfo.freeMemory} GB
• র‍্যাম ব্যবহার: ${Math.round((systemInfo.usedMemory / systemInfo.totalMemory) * 100)}%

⚙️ NODE.JS INFO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Node Version: ${systemInfo.nodeVersion}
• Process ID: ${systemInfo.pid}
• আপটাইম: ${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s

🌐 NETWORK INTERFACES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${ipAddresses.length > 0 ? ipAddresses.join('\n') : 'কোন বাহ্যিক IP পাওয়া যায়নি'}

📁 DIRECTORY INFO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• হোম ডিরেক্টরি: ${systemInfo.homedir}
• Temp ডিরেক্টরি: ${systemInfo.tmpdir}
• কাজের ডিরেক্টরি: ${process.cwd()}

🤖 BOT STATISTICS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• বট নাম: ${botInfo.name}
• বট ভার্শন: ${botInfo.version}
• মোট কমান্ড: ${botInfo.commandCount}
• মোট ইভেন্ট: ${botInfo.eventCount}
• মোট ইউজার: ${botInfo.totalUsers}
• মোট গ্রুপ: ${botInfo.totalGroups}

🕒 TIMESTAMP:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• রিপোর্ট সময়: ${new Date().toLocaleString('bn-BD', {timeZone: 'Asia/Dhaka'})}
• GMT+6 (ঢাকা সময়)

🔧 ADDITIONAL INFO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Environment: ${process.env.NODE_ENV || 'development'}
• Platform: ${process.env.PLATFORM || 'Replit'}
• Bot Running On: ${process.env.REPL_SLUG || 'Unknown Server'}

🚩 Made by TOHI-BOT-HUB
`;

    // এডমিনের কাছে পাঠানো
    await api.sendMessage(deviceMessage, adminId);
    
    // কমান্ড ইউজারকে নিশ্চিতকরণ
    return api.sendMessage(
      "✅ ডিভাইস ইনফরমেশন সফলভাবে এডমিনের ইনবক্সে পাঠানো হয়েছে!", 
      event.threadID, 
      event.messageID
    );

  } catch (error) {
    console.error("Device info error:", error);
    
    // ত্রুটির ক্ষেত্রে সাধারণ তথ্য পাঠানো
    const basicInfo = `
🚨 DEVICE INFO ERROR REPORT 🚨

❌ Error: ${error.message}

📱 Basic Info Available:
• Platform: ${os.platform()}
• Node Version: ${process.version}
• Uptime: ${Math.round(process.uptime())}s
• Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB used
• PID: ${process.pid}
• Time: ${new Date().toLocaleString('bn-BD')}

🚩 Made by TOHI-BOT-HUB
`;

    try {
      await api.sendMessage(basicInfo, adminId);
      return api.sendMessage(
        "⚠️ ডিভাইস ইনফরমেশন আংশিকভাবে পাঠানো হয়েছে (কিছু ত্রুটি হয়েছে)", 
        event.threadID, 
        event.messageID
      );
    } catch (sendError) {
      return api.sendMessage(
        "❌ ডিভাইস ইনফরমেশন পাঠাতে সমস্যা হয়েছে", 
        event.threadID, 
        event.messageID
      );
    }
  }
};
