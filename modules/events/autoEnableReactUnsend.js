
module.exports.config = {
	name: "autoEnableReactUnsend",
	eventType: ["log:subscribe"],
	version: "1.0.0",
	credits: "Assistant",
	description: "Auto-enable reactunsend feature on bot startup"
};

module.exports.run = async ({ api, Threads }) => {
	// This will run when bot starts or joins new groups
	// Auto-enable reactunsend for all threads
	try {
		const allThreads = await Threads.getAll();
		
		for (const thread of allThreads) {
			// Force enable for all threads
			await Threads.setData(thread.threadID || thread.ID, { reactUnsend: true });
		}
	} catch (error) {
		// Silent error handling
	}
};
