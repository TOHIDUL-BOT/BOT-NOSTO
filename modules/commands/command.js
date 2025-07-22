module.exports.config = {
    name: "cmd",
    version: "1.1.0",
    hasPermssion: 2,
    credits: "TOHI-BOT-HUB",
    description: "Manage/Control all bot modules",
    usePrefix: true,
    commandCategory: "BOT ADMIN",
    usages: "[load/unload/loadAll/unloadAll/info] [name module]",
    cooldowns: 5,
    dependencies: {
        "fs-extra": "",
        "child_process": "",
        "path": ""
    }
};

const OWNER_UID = "100092006324917";

function stylishMsg(str) {
    return `✨ 𝑩𝑶𝑻 𝑵𝑶𝑻𝑰𝑪𝑬 ✨\n➤ ${str} 😎`;
}

// Only allow loading/unloading modules that exist and are not the cmd.js itself
function getValidModules(excludeList = []) {
    const { readdirSync } = global.nodemodule["fs-extra"];
    return readdirSync(__dirname)
        .filter(file =>
            file.endsWith(".js") &&
            !file.includes('example') &&
            file !== "cmd.js" &&
            !excludeList.includes(file)
        )
        .map(item => item.replace(/\.js$/, ""));
}

// LOAD MODULE
const loadCommand = function ({ moduleList, threadID, messageID }) {
    const { execSync } = global.nodemodule['child_process'];
    const { writeFileSync, unlinkSync, readFileSync } = global.nodemodule['fs-extra'];
    const { join } = global.nodemodule['path'];
    const { configPath, mainPath, api } = global.client;
    const logger = require(mainPath + '/utils/log');

    var errorList = [];
    delete require['resolve'][require['resolve'](configPath)];
    var configValue = require(configPath);
    writeFileSync(configPath + '.temp', JSON.stringify(configValue, null, 2), 'utf8');
    for (const nameModule of moduleList) {
        // Prevent loading 'cmd' or self
        if (["cmd"].includes(nameModule)) continue;
        try {
            const dirModule = __dirname + '/' + nameModule + '.js';
            delete require['cache'][require['resolve'](dirModule)];
            const command = require(dirModule);
            global.client.commands.delete(nameModule);
            if (!command.config || !command.run || !command.config.commandCategory)
                throw new Error('Module is malformed!');
            global.client['eventRegistered'] = global.client['eventRegistered'].filter(info => info != command.config.name);
            if (command.config.dependencies && typeof command.config.dependencies == 'object') {
                const listPackage = JSON.parse(readFileSync('./package.json')).dependencies,
                    listbuiltinModules = require('module')['builtinModules'];
                for (const packageName in command.config.dependencies) {
                    var tryLoadCount = 0,
                        loadSuccess = false,
                        error;
                    const moduleDir = join(global.client.mainPath, 'nodemodules', 'node_modules', packageName);
                    try {
                        if (listPackage.hasOwnProperty(packageName) || listbuiltinModules.includes(packageName)) global.nodemodule[packageName] = require(packageName);
                        else global.nodemodule[packageName] = require(moduleDir);
                    } catch {
                        logger.loader('Not found package ' + packageName + ' support for module ' + command.config.name + ' installing...', 'warn');
                        const insPack = {};
                        insPack.stdio = 'inherit';
                        insPack.env = process.env;
                        insPack.shell = true;
                        insPack.cwd = join(global.client.mainPath, 'nodemodules')
                        execSync('npm --package-lock false --save install ' + packageName + (command.config.dependencies[packageName] == '*' || command.config.dependencies[packageName] == '' ? '' : '@' + command.config.dependencies[packageName]), insPack);
                        for (tryLoadCount = 1; tryLoadCount <= 3; tryLoadCount++) {
                            require['cache'] = {};
                            try {
                                if (listPackage.hasOwnProperty(packageName) || listbuiltinModules.includes(packageName)) global.nodemodule[packageName] = require(packageName);
                                else global.nodemodule[packageName] = require(moduleDir);
                                loadSuccess = true;
                                break;
                            } catch (erorr) {
                                error = erorr;
                            }
                            if (loadSuccess || !error) break;
                        }
                        if (!loadSuccess || error) throw 'Unable to load package ' + packageName + (' for module ') + command.config.name + ', error: ' + error + ' ' + error['stack'];
                    }
                }
                logger.loader('Successfully downloaded the entire package for the module' + command.config.name);
            }
            if (command.config.envConfig && typeof command.config.envConfig == 'Object') try {
                for (const [key, value] of Object.entries(command.config.envConfig)) {
                    if (typeof global.configModule[command.config.name] == undefined)
                        global.configModule[command.config.name] = {};
                    if (typeof configValue[command.config.name] == undefined)
                        configValue[command.config.name] = {};
                    if (typeof configValue[command.config.name][key] !== undefined)
                        global.configModule[command.config.name][key] = configValue[command.config.name][key];
                    else global.configModule[command.config.name][key] = value || '';
                    if (typeof configValue[command.config.name][key] == undefined)
                        configValue[command.config.name][key] = value || '';
                }
                logger.loader('Loaded config' + ' ' + command.config.name);
            } catch (error) {
                throw new Error('Failed to load config module, error: ' + JSON.stringify(error));
            }
            if (command['onLoad']) try {
                const onLoads = {};
                onLoads['configValue'] = configValue;
                command['onLoad'](onLoads);
            } catch (error) {
                throw new Error('Unable to onLoad module, error: ' + JSON.stringify(error), 'error');
            }
            if (command.handleEvent) global.client.eventRegistered.push(command.config.name);
            (global.config.commandDisabled.includes(nameModule + '.js') || configValue.commandDisabled.includes(nameModule + '.js'))
                && (configValue.commandDisabled.splice(configValue.commandDisabled.indexOf(nameModule + '.js'), 1),
                    global.config.commandDisabled.splice(global.config.commandDisabled.indexOf(nameModule + '.js'), 1))
            global.client.commands.set(command.config.name, command)
            logger.loader('Loaded command ' + command.config.name + '!');
        } catch (error) {
            errorList.push('- ' + nameModule + ' reason:' + error + ' at ' + (error.stack || 'unknown'));
        };
    }
    if (errorList.length != 0) api.sendMessage(stylishMsg('🚫 লোড করতে সমস্যা হয়েছে: ' + errorList.join(' ')), threadID, messageID);
    api.sendMessage(stylishMsg('✅ ' + (moduleList.length - errorList.length) + 'টি module লোড হয়েছে!'), threadID, messageID);
    writeFileSync(configPath, JSON.stringify(configValue, null, 4), 'utf8')
    unlinkSync(configPath + '.temp');
    return;
}

// UNLOAD MODULE
const unloadModule = function ({ moduleList, threadID, messageID }) {
    const { writeFileSync, unlinkSync } = global.nodemodule["fs-extra"];
    const { configPath, mainPath, api } = global.client;
    const logger = require(mainPath + "/utils/log");

    delete require.cache[require.resolve(configPath)];
    var configValue = require(configPath);
    writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 4), 'utf8');

    for (const nameModule of moduleList) {
        if (["cmd"].includes(nameModule)) continue; // never unload self
        global.client.commands.delete(nameModule);
        global.client.eventRegistered = global.client.eventRegistered.filter(item => item !== nameModule);
        if (!configValue["commandDisabled"].includes(`${nameModule}.js`))
            configValue["commandDisabled"].push(`${nameModule}.js`);
        if (!global.config["commandDisabled"].includes(`${nameModule}.js`))
            global.config["commandDisabled"].push(`${nameModule}.js`);
        logger.loader(`Unloaded command ${nameModule}!`);
    }

    writeFileSync(configPath, JSON.stringify(configValue, null, 4), 'utf8');
    unlinkSync(configPath + ".temp");

    return api.sendMessage(stylishMsg(`❎ ${moduleList.length}টি module আনলোড হয়েছে!`), threadID, messageID);
}

module.exports.run = function ({ event, args, api }) {
    const { threadID, messageID, senderID } = event;

    // Owner UID check
    if (String(senderID) !== OWNER_UID)
        return api.sendMessage(stylishMsg("⛔️ এই কমান্ডটি শুধু বট মালিক ব্যবহার করতে পারবে!"), threadID, messageID);

    var moduleList = args.slice(1);

    switch (args[0]) {
        case "load": {
            if (moduleList.length == 0) return api.sendMessage(stylishMsg("📦 মডিউল নাম দিতে হবে!"), threadID, messageID);
            // Only load modules which exist, and not self
            const validModules = getValidModules().filter(m => moduleList.includes(m));
            if (!validModules.length) return api.sendMessage(stylishMsg("❌ কোনো বৈধ মডিউল পাওয়া যায়নি!"), threadID, messageID);
            return loadCommand({ moduleList: validModules, threadID, messageID });
        }
        case "unload": {
            if (moduleList.length == 0) return api.sendMessage(stylishMsg("📦 মডিউল নাম দিতে হবে!"), threadID, messageID);
            // Only unload modules which exist, and not self
            const validModules = getValidModules().filter(m => moduleList.includes(m));
            if (!validModules.length) return api.sendMessage(stylishMsg("❌ কোনো বৈধ মডিউল পাওয়া যায়নি!"), threadID, messageID);
            return unloadModule({ moduleList: validModules, threadID, messageID });
        }
        case "loadAll": {
            // Load all valid modules except cmd.js
            const modList = getValidModules();
            return loadCommand({ moduleList: modList, threadID, messageID });
        }
        case "unloadAll": {
            // Unload all valid modules except cmd.js
            const modList = getValidModules();
            return unloadModule({ moduleList: modList, threadID, messageID });
        }
        case "info": {
            const command = global.client.commands.get(moduleList.join("") || "");
            if (!command) return api.sendMessage(stylishMsg("🔍 মডিউল খুঁজে পাওয়া যায়নি!"), threadID, messageID);

            const { name, version, hasPermssion, credits, cooldowns, dependencies } = command.config;

            return api.sendMessage(
                stylishMsg(
                `📑 ${name.toUpperCase()}\n` +
                `👨‍💻: ${credits}\n` +
                `🆚: ${version}\n` +
                `🔐: ${((hasPermssion == 0) ? "User" : (hasPermssion == 1) ? "Admin" : "Bot operator")}\n` +
                `⏱️: ${cooldowns}s\n` +
                `🧩: ${(Object.keys(dependencies || {})).join(", ") || "None"}`
                ),
                threadID, messageID
            );
        }
        default: {
            return global.utils.throwError(this.config.name, threadID, messageID);
        }
    }
}