
module.exports.config = {
    name: "fixnames",
    version: "1.0.0",
    permission: 2,
    credits: "TOHI-BOT-HUB",
    usePrefix: true,
    description: "Fix null names in user database",
    commandCategory: "admin",
    usages: "fixnames",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, Users }) {
    const { threadID, messageID, senderID } = event;
    
    // Only allow owner
    if (senderID !== "100092006324917") {
        return api.sendMessage("⛔️ শুধুমাত্র owner এই কমান্ড ব্যবহার করতে পারবেন!", threadID, messageID);
    }

    try {
        const fs = require("fs-extra");
        const path = __dirname + "/../../includes/database/data/usersData.json";
        
        // Load current user data
        const rawData = fs.readFileSync(path, 'utf8');
        const usersData = JSON.parse(rawData);
        
        let fixedCount = 0;
        let totalUsers = Object.keys(usersData).length;
        
        api.sendMessage(`🔄 Fixing null names in user database...\n📊 Total users: ${totalUsers}\n⏳ Please wait...`, threadID);

        // Process users in batches to avoid rate limiting
        const userIDs = Object.keys(usersData);
        const batchSize = 10;
        
        for (let i = 0; i < userIDs.length; i += batchSize) {
            const batch = userIDs.slice(i, i + batchSize);
            
            await Promise.all(batch.map(async (userID) => {
                try {
                    const userData = usersData[userID];
                    
                    // Check if name is null, undefined, or empty
                    if (!userData.name || userData.name === null || userData.name === 'undefined' || userData.name.trim() === '') {
                        console.log(`[FIXNAMES] Fixing name for user ${userID}`);
                        
                        try {
                            // Try to get name from Facebook API
                            const userInfo = await api.getUserInfo(userID);
                            if (userInfo && userInfo[userID] && userInfo[userID].name && userInfo[userID].name.trim()) {
                                const name = userInfo[userID].name.trim();
                                usersData[userID].name = name;
                                usersData[userID].lastUpdate = Date.now();
                                fixedCount++;
                                console.log(`[FIXNAMES] Fixed name for ${userID}: ${name}`);
                            } else {
                                // Generate fallback name
                                const shortId = userID.slice(-6);
                                usersData[userID].name = `User_${shortId}`;
                                usersData[userID].lastUpdate = Date.now();
                                fixedCount++;
                                console.log(`[FIXNAMES] Set fallback name for ${userID}: User_${shortId}`);
                            }
                        } catch (apiError) {
                            console.log(`[FIXNAMES] API error for ${userID}: ${apiError.message}`);
                            // Set fallback name
                            const shortId = userID.slice(-6);
                            usersData[userID].name = `User_${shortId}`;
                            usersData[userID].lastUpdate = Date.now();
                            fixedCount++;
                        }
                    }
                } catch (error) {
                    console.log(`[FIXNAMES] Error processing user ${userID}: ${error.message}`);
                }
            }));
            
            // Small delay between batches
            if (i + batchSize < userIDs.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // Save updated data
        fs.writeFileSync(path, JSON.stringify(usersData, null, 2));
        
        return api.sendMessage(`✅ Name fixing completed!\n\n📊 Results:\n• Total users: ${totalUsers}\n• Fixed names: ${fixedCount}\n• Status: ${fixedCount > 0 ? 'Names updated successfully' : 'No null names found'}\n\n✨ All user names are now properly saved!`, threadID, messageID);
        
    } catch (error) {
        console.error("[FIXNAMES] Error:", error);
        return api.sendMessage(`❌ Error fixing names: ${error.message}`, threadID, messageID);
    }
};
