module.exports = {
  config: {
    name: "eval",
    version: "2.0.0",
    author: "TOHI-BOT-HUB & NTKhang",
    countDown: 5,
    permission: 2, // Only bot admin can use
    usePrefix: true,
    description: {
      en: "Test and execute JavaScript code live (BOT ADMIN only)"
    },
    commandCategory: "BOT ADMIN",
    guide: {
      en: "{pn} <JavaScript code>"
    }
  },

  run: async function ({
    api, args, event, message
  }) {
    // Helper to output results
    function output(msg) {
      if (typeof msg === "number" || typeof msg === "boolean" || typeof msg === "function")
        msg = msg.toString();
      else if (msg instanceof Map) {
        let text = `Map(${msg.size}) `;
        text += JSON.stringify(mapToObj(msg), null, 2);
        msg = text;
      }
      else if (typeof msg === "object" && msg !== null)
        msg = JSON.stringify(msg, null, 2);
      else if (typeof msg === "undefined")
        msg = "undefined";
      message.reply(msg);
    }

    // Helper to convert Map to Object
    function mapToObj(map) {
      const obj = {};
      map.forEach((v, k) => {
        obj[k] = v;
      });
      return obj;
    }

    // Allow using output() or out() in code
    function out(msg) {
      output(msg);
    }

    // Build code to eval
    const code = args.join(" ");
    if (!code) {
      return message.reply("❌ Please provide JS code to evaluate!");
    }

    const cmd = `
      (async () => {
        try {
          ${code}
        } catch (err) {
          console.error("eval command error:", err);
          message.reply("❌ An error occurred:\\n" + (err.stack || err));
        }
      })();
    `;

    try {
      eval(cmd);
    } catch (err) {
      message.reply("❌ Failed to evaluate the code:\\n" + (err.stack || err));
    }
  }
};