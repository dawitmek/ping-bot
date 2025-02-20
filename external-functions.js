const { MongoClient } = require("mongodb");
const dbClient = new MongoClient(process.env.MongoClient);

async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function databaseConnect() {
    await dbClient.connect();
}

async function closeDatabase() {
    await dbClient.close();
}

async function updateUserMessage(guild, user, newMessage) {
    let replaced = await dbClient
        .db("Ping-Bot")
        .collection(guild)
        .updateOne(
            {
                id: user.id,
            },
            {
                $set: {
                    message: `Message: ${newMessage}`,
                },
            }
        );
    return replaced;
}


async function updateUsers(guild, user, newUsers, interaction) {

    let userObj = new Map();
    for (const user of newUsers) {
        let userInfo = await interaction.guild.members.fetch({ user: user, force: true });

        // uses their nickname if they have one, otherwise uses their true username
        let userData = {
            guildName: userInfo.nickname,
            globalName: !userInfo.user.globalName ? userInfo.user.username : userInfo.user.globalName,
        }
        userObj.set(userInfo.id, userData);
    }

    let replaced = await dbClient
        .db("Ping-Bot")
        .collection(guild)
        .updateOne(
            {
                id: user.id,
            },
            {
                $set: {
                    pingUsers: userObj,
                    lastModified: new Date().toLocaleString(),
                },
            }
        );
    // if replace returns error, creates document
    if (replaced.matchedCount < 1) {
        return await dbClient
            .db("Ping-Bot")
            .collection(guild)
            .insertOne({
                id: user.id,
                pingUsers: userObj,
                message: `You're getting pinged!`,
                lastModified: new Date().toLocaleString(),
            });
    } else return replaced;
}

async function findUsers(guild, user) {
    try {
        return await dbClient.db("Ping-Bot").collection(guild).findOne({
            id: user,
        });
    } catch (error) {
        console.error(error);
    }
}

function rateLimiterOK(userID) {
    const rateLimitMap = new Map(); // Keeps track of request counts per user
    const limit = 50; // Request limit
    const timeWindow = 1000; // Alowed time window is 1 second 

    // Function to check if the user is within the limit
    function isWithinLimit(userId, limit, timeWindow) {
        const currentTime = Date.now();

        // Get or initialize user's data
        const userData = rateLimitMap.get(userId) || { count: 0, startTime: currentTime };

        if (currentTime - userData.startTime < timeWindow) {
            // If within time window, check count
            if (userData.count < limit) {
                userData.count++; // Increase request count
                rateLimitMap.set(userId, userData); // Update user data
                return true; // Request is allowed
            } else {
                return false; // Request limit exceeded
            }
        } else {
            // If time window expired, reset counter
            rateLimitMap.set(userId, { count: 1, startTime: currentTime });
            return true; // Allow the request
        }
    }

    return isWithinLimit(userID, limit, timeWindow);
}

module.exports = {
    sleep,
    databaseConnect,
    closeDatabase,
    updateUserMessage,
    updateUsers,
    findUsers,
    rateLimiterOK,
    dbClient,
};