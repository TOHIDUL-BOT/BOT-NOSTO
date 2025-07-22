module.exports.config = {
  name: "botLeave", 
  eventType: ["log:unsubscribe"],
  version: "1.0.0",
  credits: "TOHI-BOT-HUB",
  description: "Delete group data when bot is kicked or leaves from group"
};

module.exports.run = async function({ api, event, Threads }) {
  try {
    const { threadID } = event;
    const { leftParticipantFbId } = event.logMessageData;

    // Check if the bot itself left/was kicked
    if (leftParticipantFbId == api.getCurrentUserID()) {
      console.log(`🤖 Bot left/kicked from group: ${threadID}`);
      console.log(`🗑️ Starting complete data cleanup for group: ${threadID}`);

      try {
        // 1. Delete from threadsData.json using Threads database
        await Threads.delData(threadID);
        console.log(`✅ Deleted from threadsData.json: ${threadID}`);

        // 2. Remove from all global data arrays and maps
        if (global.data.allThreadID && global.data.allThreadID.includes(threadID)) {
          const allThreadIDIndex = global.data.allThreadID.indexOf(threadID);
          global.data.allThreadID.splice(allThreadIDIndex, 1);
          console.log(`✅ Removed from allThreadID array: ${threadID}`);
        }

        // 3. Remove thread info from global maps
        if (global.data.threadInfo && global.data.threadInfo.has(threadID)) {
          global.data.threadInfo.delete(threadID);
          console.log(`✅ Removed from threadInfo map: ${threadID}`);
        }

        if (global.data.threadData && global.data.threadData.has(threadID)) {
          global.data.threadData.delete(threadID);
          console.log(`✅ Removed from threadData map: ${threadID}`);
        }

        // 4. Remove from banned/restricted lists
        if (global.data.threadBanned && global.data.threadBanned.has(threadID)) {
          global.data.threadBanned.delete(threadID);
          console.log(`✅ Removed from threadBanned map: ${threadID}`);
        }

        // 5. Remove from NSFW allowed list
        if (global.data.threadAllowNSFW && global.data.threadAllowNSFW.includes(threadID)) {
          const nsfwIndex = global.data.threadAllowNSFW.indexOf(threadID);
          global.data.threadAllowNSFW.splice(nsfwIndex, 1);
          console.log(`✅ Removed from threadAllowNSFW array: ${threadID}`);
        }

        // 6. Remove from approval system if exists
        const { writeFileSync, readFileSync } = require("fs-extra");
        const configPath = process.cwd() + '/config.json';

        try {
          const config = JSON.parse(readFileSync(configPath, 'utf8'));

          if (config.APPROVAL) {
            let configChanged = false;

            // Remove from pending groups
            if (config.APPROVAL.pendingGroups && config.APPROVAL.pendingGroups.includes(threadID)) {
              config.APPROVAL.pendingGroups = config.APPROVAL.pendingGroups.filter(id => id !== threadID);
              configChanged = true;
              console.log(`✅ Removed from pending approval: ${threadID}`);
            }

            // Remove from approved groups
            if (config.APPROVAL.approvedGroups && config.APPROVAL.approvedGroups.includes(threadID)) {
              config.APPROVAL.approvedGroups = config.APPROVAL.approvedGroups.filter(id => id !== threadID);
              configChanged = true;
              console.log(`✅ Removed from approved groups: ${threadID}`);
            }

            // Remove from rejected groups
            if (config.APPROVAL.rejectedGroups && config.APPROVAL.rejectedGroups.includes(threadID)) {
              config.APPROVAL.rejectedGroups = config.APPROVAL.rejectedGroups.filter(id => id !== threadID);
              configChanged = true;
              console.log(`✅ Removed from rejected groups: ${threadID}`);
            }

            // Save config if changes were made
            if (configChanged) {
              writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
              console.log(`✅ Updated config.json for group: ${threadID}`);
            }
          }
        } catch (configError) {
          console.log(`⚠️ Could not update config.json: ${configError.message}`);
        }

        // 7. Log successful cleanup
        global.loading.log(`⫸ TBH ➤ [ DELETE DATA ] Complete data cleanup completed for group ${threadID}`, "DATABASE");
        console.log(`🎉 Successfully deleted ALL data for group: ${threadID}`);
        console.log(`📊 Cleanup Summary:
┣━ threadsData.json: ✅ Deleted
┣━ Global arrays: ✅ Cleaned
┣━ Global maps: ✅ Cleaned  
┣━ Banned lists: ✅ Cleaned
┣━ NSFW lists: ✅ Cleaned
┣━ Approval system: ✅ Cleaned
┗━ Config.json: ✅ Updated`);

      } catch (error) {
        // Only log critical database errors, ignore API rate limit errors
        if (!error.message.includes('Rate limited') && 
            !error.message.includes('not part of the conversation') &&
            !error.message.includes('Jimp.read') &&
            !error.message.includes('Max retries reached')) {
          console.error(`❌ Error during data cleanup for ${threadID}:`, error);
          global.loading.err(`Failed to cleanup data for ${threadID}: ${error.message}`, "DATABASE");
        }
      }
    }

  } catch (error) {
    // Ignore common API errors that happen when bot leaves groups
    if (!error.message.includes('Rate limited') && 
        !error.message.includes('not part of the conversation') && 
        !error.message.includes('Jimp.read') &&
        !error.message.includes('Max retries reached') &&
        !error.message.includes('Avatar processing error')) {
      console.error("Error in botLeave event:", error);
    }
  }
};