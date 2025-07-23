module.exports = function ({ api }) {
    const { writeFileSync } = require("fs-extra");
    var path = __dirname + "/data/usersData.json";

    try {
        var usersData = require(path)
    } catch {
        writeFileSync(path, "{}", { flag: 'a+' });
    }

    // PostgreSQL integration
    const config = require('../../config.json');
    let PostgreSQL = null;
    if (config.DATABASE?.enabled) {
        try {
            PostgreSQL = require('./postgresql')();
        } catch (error) {
            console.log('PostgreSQL connection failed:', error.message);
        }
    }

    async function saveData(data) {
        try {
            if (!data) throw new Error('Data cannot be left blank');
            writeFileSync(path, JSON.stringify(data, null, 4))
            return true
        } catch (error) {
            return false
        }
    }

    async function getInfo(id) {
        try {
            const globalErrorHandler = require('../../utils/globalErrorHandler');
            const userInfo = await globalErrorHandler.rateLimitedGetUserInfo(api, id);
            return userInfo[id];
        } catch (error) {
            console.log(`Error getting user info for ${id}: ${error.message}`);
            return null;
        }
    }

    async function getNameUser(userID) {
        try {
            if (!userID) throw new Error("User ID cannot be blank");
            if (isNaN(userID)) throw new Error("Invalid user ID");
            
            // First check if we have cached name in userData
            const userData = usersData[userID];
            if (userData && userData.name && userData.name !== 'undefined' && userData.name.trim() && !userData.name.startsWith('User-')) {
                return userData.name;
            }
            
            // Try to get from Facebook API
            try {
                const globalErrorHandler = require('../../utils/globalErrorHandler');
                const userInfo = await globalErrorHandler.rateLimitedGetUserInfo(api, userID);
                
                if (userInfo && userInfo[userID]?.name && userInfo[userID].name.trim()) {
                    const name = userInfo[userID].name.trim();
                    
                    // Cache the name in our database
                    if (!usersData[userID]) {
                        await createData(userID);
                    }
                    
                    // Make sure usersData[userID] exists before setting name
                    if (usersData[userID]) {
                        usersData[userID].name = name;
                        await saveData(usersData);
                    }
                    
                    return name;
                }
            } catch (apiError) {
                console.log(`[USERS] API error for ${userID}: ${apiError.message}`);
            }
            
            // Fallback to generating a name
            const shortId = userID.slice(-6);
            return `User_${shortId}`;
            
        } catch (error) {
            console.log(`[USERS] Error getting name for ${userID}: ${error.message}`);
            const shortId = userID.slice(-6);
            return `User_${shortId}`;
        }
    }

    async function getUserFull(id) {
        var resolveFunc = function () { };
        var rejectFunc = function () { };
        var returnPromise = new Promise(function (resolve, reject) {
            resolveFunc = resolve;
            rejectFunc = reject;
        });
        try {
            api.httpGet(`https://graph.facebook.com/${id}?fields=email,about,birthday,link&access_token=${global.account.accessToken}`, (e, i) => {
                if (e) return rejectFunc(e)
                var t = JSON.parse(i);
                var dataUser = {
                    error: 0,
                    author: 'D-Jukie',
                    data: {
                        uid: t.id || null,
                        about: t.about || null,
                        link: t.link || null,
                        imgavt: `https://graph.facebook.com/${t.id}/picture?height=1500&width=1500&access_token=1073911769817594|aa417da57f9e260d1ac1ec4530b417de`
                    }
                };
                return resolveFunc(dataUser)
            });
            return returnPromise
        } catch (error) {
            return resolveFunc({
                error: 1,
                author: 'D-Jukie',
                data: {}
            })
        }
    }

    async function getAll(keys, callback) {
        try {
            if (!keys) {
                if (Object.keys(usersData).length == 0) return [];
                else if (Object.keys(usersData).length > 0) {
                    var db = [];
                    for (var i of Object.keys(usersData)) db.push(usersData[i]);
                    return db;
                }
            }
            if (!Array.isArray(keys)) throw new Error("The input parameter must be an array");
            const data = [];
            for (var userID in usersData) {
                var database = {
                    ID: userID
                };
                var userData = usersData[userID];
                for (var i of keys) database[i] = userData[i];
                data.push(database);
            }
            if (callback && typeof callback == "function") callback(null, data);
            return data;
        } catch (error) {
            if (callback && typeof callback == "function") callback(error, null);
            return false
        }
    }

    async function getData(userID, callback) {
        try {
            if (!userID) throw new Error("User ID cannot be blank");
            if (isNaN(userID)) throw new Error("Invalid user ID");
            
            // Try PostgreSQL first
            if (global.PostgreSQL) {
                let data = await global.PostgreSQL.getUser(userID);
                if (!data) {
                    await createData(userID);
                    data = await global.PostgreSQL.getUser(userID);
                }
                if (data) {
                    if (callback && typeof callback == "function") callback(null, data);
                    return data;
                }
            }
            
            // Fallback to JSON
            if (!usersData.hasOwnProperty(userID)) await createData(userID, (error, info) => {
                return info;
            });
            const data = usersData[userID];
            if (callback && typeof callback == "function") callback(null, data);
            return data;
        } catch (error) {
            if (callback && typeof callback == "function") callback(error, null);
            return false
        }
    }

    async function setData(userID, options, callback) {
        try {
            if (!userID) throw new Error("User ID cannot be blank");
            if (isNaN(userID)) throw new Error("Invalid user ID");
            if (!userID) throw new Error("userID cannot be empty");
            if (typeof options != 'object') throw new Error("The options parameter passed must be an object");
            
            // Update in PostgreSQL first
            if (PostgreSQL) {
                await PostgreSQL.updateUser(userID, options);
                const updatedData = await PostgreSQL.getUser(userID);
                if (updatedData) {
                    if (callback && typeof callback == "function") callback(null, updatedData);
                    return updatedData;
                }
            }
            
            // Fallback to JSON
            if (global.config.autoCreateDB) {
                if (!usersData.hasOwnProperty(userID)) {
                    // Auto-create if not exists
                    await createData(userID);
                }
            }
            
            // Ensure user data exists
            if (!usersData[userID]) {
                await createData(userID);
            }
            
            const currentData = usersData[userID] || {};
            const cleanOptions = { ...options };
            
            if (cleanOptions.data && typeof cleanOptions.data === 'object' && cleanOptions.data.data) {
                delete cleanOptions.data.data;
            }
            
            usersData[userID] = { ...currentData, ...cleanOptions };
            await saveData(usersData);
            if (callback && typeof callback == "function") callback(null, usersData[userID]);
            return usersData[userID];
        } catch (error) {
            if (callback && typeof callback == "function") callback(error, null);
            return false
        }
    }

    async function delData(userID, callback) {
        try {
            if (!userID) throw new Error("User ID cannot be blank");
            if (isNaN(userID)) throw new Error("Invalid user ID");
            if (global.config.autoCreateDB) {
                if (!usersData.hasOwnProperty(userID)) throw new Error(`User ID: ${userID} does not exist in Database`);
            }
            delete usersData[userID];
            await saveData(usersData);
            if (callback && typeof callback == "function") callback(null, usersData);
            return usersData;
        } catch (error) {
            if (callback && typeof callback == "function") callback(error, null);
            return false
        }
    }

    async function createData(userID, callback) {
        try {
            if (!userID) throw new Error("User ID cannot be blank");
            userID = String(userID);
            
            // Create in PostgreSQL first
            if (global.PostgreSQL) {
                const existingData = await global.PostgreSQL.getUser(userID);
                if (existingData) {
                    if (callback && typeof callback == "function") callback(null, existingData);
                    return existingData;
                }
                
                const userData = {
                    userID: userID,
                    money: 0,
                    exp: 0,
                    data: { timestamp: Date.now() },
                    busy: false,
                    name: undefined
                };
                
                await global.PostgreSQL.createUser(userID, userData);
                const newData = await global.PostgreSQL.getUser(userID);
                
                if (callback && typeof callback == "function") callback(null, newData);
                return newData;
            }
            
            // Fallback to JSON
            if (usersData.hasOwnProperty(userID)) {
                const existingData = usersData[userID];
                
                if (existingData.data && existingData.data.data) {
                    console.log(`⚠️  Cleaning corrupted nested data for user ${userID}`);
                    
                    const cleanData = {
                        userID: userID,
                        money: existingData.money || 0,
                        exp: existingData.exp || 0,
                        createTime: existingData.createTime || { timestamp: Date.now() },
                        data: { timestamp: existingData.data.timestamp || Date.now() },
                        lastUpdate: existingData.lastUpdate || Date.now(),
                        name: existingData.name || undefined
                    };
                    
                    usersData[userID] = cleanData;
                    await saveData(usersData);
                    console.log(`✓ Cleaned corrupted data for user ${userID}`);
                }
                
                if (callback && typeof callback == "function") callback(null, usersData[userID]);
                return usersData[userID];
            }
            
            const userData = {
                userID: userID,
                money: 0,
                exp: 0,
                createTime: { timestamp: Date.now() },
                data: { timestamp: Date.now() },
                lastUpdate: Date.now()
            };
            
            usersData[userID] = userData;
            await saveData(usersData);
            
            if (global.data && global.data.allUserID && !global.data.allUserID.includes(userID)) {
                global.data.allUserID.push(userID);
            }
            
            console.log(`✓ User data created successfully for ${userID}`);
            
            if (callback && typeof callback == "function") callback(null, userData);
            return userData;
        } catch (error) {
            console.log(`Database creation error for ${userID}: ${error.message}`);
            
            if (!usersData.hasOwnProperty(userID)) {
                usersData[userID] = {
                    userID: userID,
                    money: 0,
                    exp: 0,
                    createTime: { timestamp: Date.now() },
                    data: { timestamp: Date.now() },
                    lastUpdate: Date.now()
                };
                
                try {
                    await saveData(usersData);
                } catch (saveError) {
                    console.log(`Failed to save user data for ${userID}: ${saveError.message}`);
                }
            }
            
            if (callback && typeof callback == "function") callback(null, usersData[userID] || null);
            return usersData[userID] || false;
        }
    }

    return {
        getInfo,
        getNameUser,
        getAll,
        getData,
        setData,
        delData,
        createData,
        getUserFull
    };
};
