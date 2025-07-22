const axios = require('axios');

module.exports.config = {
  name: "youtube",
  version: "1.1",
  credits: "kennethpanio (fixed by Copilot)",
  description: "Search videos on YouTube",
  hasPermssion: 0,
  commandCategory: "media",
  usePrefix: true,
  usages: "<keywords>",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const query = args.join(" ");
  if (!query) {
    api.sendMessage("🔍 Please provide a search query.", event.threadID, event.messageID);
    return;
  }

  // Your YouTube API key (should not be public for production use)
  const apiKey = "AIzaSyDtkiIIDpdjVA8ZbsLrkxEzW12lucdAKSQ";
  const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&part=snippet&type=video&maxResults=5&q=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(url);
    const searchResults = response.data.items;

    if (!searchResults || searchResults.length === 0) {
      api.sendMessage("❌ No videos found for your search.", event.threadID, event.messageID);
      return;
    }

    let message = "";
    let hasVideo = false;

    searchResults.forEach((result, index) => {
      // Defensive: If no videoId, skip this entry
      const videoId = result.id && result.id.videoId ? result.id.videoId : null;
      if (!videoId) return; // Skip if not a real video
      hasVideo = true;
      const title = result.snippet.title || "No Title";
      const description = result.snippet.description || "No Description";
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      message += `🔎 Result ${index + 1}:\n📝 Title: ${title}\n📃 Description: ${description}\n🔗 Link: ${videoUrl}\n\n`;
    });

    if (!hasVideo) {
      api.sendMessage("❌ No videos found for your search.", event.threadID, event.messageID);
      return;
    }

    api.sendMessage(message.trim(), event.threadID, event.messageID);
  } catch (error) {
    console.error(error);
    api.sendMessage("❌ An error occurred while searching YouTube.", event.threadID, event.messageID);
  }
};