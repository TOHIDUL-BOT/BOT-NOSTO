
"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function(defaultFuncs, api, ctx) {
    return function handleReactionEvent(callback) {
        let resolveFunc = function() {};
        let rejectFunc = function() {};
        const returnPromise = new Promise(function(resolve, reject) {
            resolveFunc = resolve;
            rejectFunc = reject;
        });

        if (!callback) {
            callback = function(err, data) {
                if (err) {
                    return rejectFunc(err);
                }
                resolveFunc(data);
            };
        }

        // Listen for reaction events
        const reactionHandler = function(event) {
            if (event.type === "message_reaction") {
                const { threadID, messageID, userID, reaction, senderID } = event;
                
                // Process reaction for unsend functionality
                if (reaction && messageID) {
                    // Check if this is an unsend reaction
                    const unsendReactions = [
                        "😠", "😡", "❌", "🗑️", "🚮",
                        "\uD83D\uDE20", "\uD83D\uDE21", "\u274C", "\uD83D\uDDD1\uFE0F"
                    ];
                    
                    if (unsendReactions.includes(reaction)) {
                        // Check if user is admin
                        const adminIDs = global.config?.ADMINBOT || [];
                        const botID = api.getCurrentUserID();
                        
                        if (senderID === botID && adminIDs.includes(userID)) {
                            // Unsend the message
                            api.unsendMessage(messageID)
                                .then(() => {
                                    log.info("handleReactionEvent", `Message ${messageID} unsent via reaction by ${userID}`);
                                })
                                .catch(err => {
                                    log.error("handleReactionEvent", `Failed to unsend message: ${err}`);
                                });
                        }
                    }
                }
                
                callback(null, event);
            }
        };

        return returnPromise;
    };
};
