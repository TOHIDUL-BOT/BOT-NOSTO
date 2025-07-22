
module.exports.config = {
  name: "cleanusers",
  version: "1.0.0",
  hasPermssion: 2,
  usePrefix: true,
  credits: "TOHI-BOT-HUB",
  description: "Clean corrupted nested user data",
  commandCategory: "BOT ADMIN",
  usages: "/cleanusers",
  cooldowns: 30
};

const OWNER_ID = "100092006324917";

module.exports.run = async function ({ api, event, Users }) {
  if (event.senderID !== OWNER_ID) {
    return api.sendMessage(`⛔️ শুধুমাত্র owner এই কমান্ড ব্যবহার করতে পারবেন!`, event.threadID, event.messageID);
  }

  const { threadID, messageID } = event;
  const fs = require("fs-extra");
  const path = __dirname + "/../../includes/database/data/usersData.json";

  try {
    // Load current user data
    const rawData = fs.readFileSync(path, 'utf8');
    const usersData = JSON.parse(rawData);
    
    let cleanedCount = 0;
    let totalUsers = Object.keys(usersData).length;
    
    api.sendMessage(`🔄 Cleaning user data...\n📊 Total users: ${totalUsers}\n⏳ Please wait...`, threadID);

    // Clean each user's data
    for (const userID in usersData) {
      const userData = usersData[userID];
      
      // Check if data has nested corruption
      if (userData.data && userData.data.data) {
        console.log(`⚠️  Cleaning corrupted data for user ${userID}`);
        
        // Extract the clean data from the top level
        const cleanUserData = {
          userID: userID,
          money: userData.money || 0,
          exp: userData.exp || 0,
          createTime: userData.createTime || { timestamp: Date.now() },
          data: { timestamp: userData.data.timestamp || Date.now() },
          lastUpdate: userData.lastUpdate || Date.now()
        };
        
        // Keep name if it exists and is valid
        if (userData.name && userData.name !== 'undefined' && userData.name.trim()) {
          cleanUserData.name = userData.name;
        }
        
        usersData[userID] = cleanUserData;
        cleanedCount++;
      }
    }
    
    // Save cleaned data
    if (cleanedCount > 0) {
      fs.writeFileSync(path, JSON.stringify(usersData, null, 4));
      
      await api.sendMessage(`✅ User data cleanup completed!\n\n📊 Results:\n• Total users: ${totalUsers}\n• Cleaned: ${cleanedCount}\n• Status: ${cleanedCount > 0 ? 'Fixed corrupted data' : 'No issues found'}`, threadID, messageID);
    } else {
      await api.sendMessage(`✅ User data is clean!\n\n📊 Results:\n• Total users: ${totalUsers}\n• Issues found: 0\n• Status: All data is properly structured`, threadID, messageID);
    }

  } catch (error) {
    console.error("Error cleaning user data:", error);
    await api.sendMessage(`❌ Error cleaning user data: ${error.message}`, threadID, messageID);
  }
};
