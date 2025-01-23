// Require the necessary discord.js classes
const { Client, Collection, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, WebhookClient } = require("discord.js");
const { MongoClient } = require("mongodb");

const token = process.env.PINGBOTTOKEN;
const dbClient = new MongoClient(process.env.MongoClient);
const exportedCommands = require("./deploy-commands.js");
const { EmbedBuilder } = require("@discordjs/builders");

// Create a new client instance Discord.js
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers
    ],
});

client.commands = new Collection();

// When the client is ready, run this code (only once) Discord.js
client.once("ready", () => {
    console.log(new Date().toLocaleString() + " Ready from discord.js!");
    client.user.setActivity("Friends", {
        type: "WATCHING",
    });
});

client.on("messageCreate", (message) => {
    if (message.author.bot) return false;
});

async function findUsers(guild, user) {
    try {
        return await dbClient.db("Ping-Bot").collection(guild).findOne({
            id: user,
        });
    } catch (error) {
        console.error(error);
    }
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
async function databaseConnect() {
    await dbClient.connect();
}

async function closeDatabase() {
    await dbClient.close();
}
//	Discord.js
try {

    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isCommand()) return;

        const { commandName } = interaction;
        try {

            switch (commandName) {
                case "ping":
                    await databaseConnect()
                        .then(() => pingCommand(interaction))
                        .catch((err) => {
                            if (interaction.deferred && !interaction.replied) {
                                if (err.name == "MongoNotConnectedError") {
                                    interaction.editReply({
                                        content: "Something went wrong with the database while processing your request.",
                                        ephemeral: true,
                                    })
                                    console.error("Database connection error: ", err)

                                } else {
                                    interaction.editReply({
                                        content: "Something went wrong while processing your request.",
                                        ephemeral: true,
                                    })
                                    console.error("Client error: ", err)
                                }
                            }
                        });
                    break;
                case "ping-edit":
                    await databaseConnect()
                        .then(() => pingEditCommand(interaction))
                        .catch((err) => {
                            if (interaction.deferred && !interaction.replied) {
                                if (err.name == "MongoNotConnectedError") {
                                    interaction.editReply({
                                        content: "Something went wrong with the database while processing your request.",
                                        ephemeral: true,
                                    })
                                    console.error("Database connection error: ", err)

                                } else {
                                    interaction.editReply({
                                        content: "Something went wrong while processing your request.",
                                        ephemeral: true,
                                    })
                                    console.error("Client error: ", err)
                                }
                            }
                        });
                    break;
                case "ping-help":
                    await databaseConnect()
                        .then(() => pingHelpCommand(interaction))
                        .catch((err) => {
                            if (interaction.deferred && !interaction.replied) {
                                if (err.name == "MongoNotConnectedError") {
                                    interaction.editReply({
                                        content: "Something went wrong with the database while processing your request.",
                                        ephemeral: true,
                                    })
                                    console.error("Database connection error: ", err)

                                } else {
                                    interaction.editReply({
                                        content: "Something went wrong while processing your request.",
                                        ephemeral: true,
                                    })
                                    console.error("Client error: ", err)
                                }
                            }
                        });
                    break;
                case "ping-message":
                    await databaseConnect()
                        .then(async () => await pingMessageCommand(interaction))
                        .catch((err) => {
                            if (interaction.deferred && !interaction.replied) {
                                if (err.name == "MongoNotConnectedError") {
                                    interaction.editReply({
                                        content: "Something went wrong with the database while processing your request.",
                                        ephemeral: true,
                                    })
                                    console.error("Database connection error: ", err)

                                } else {
                                    interaction.editReply({
                                        content: "Something went wrong while processing your request.",
                                        ephemeral: true,
                                    })
                                    console.error("Client error: ", err)
                                }
                            }
                        });
                    break;
                case "ping-check":
                    await databaseConnect()
                        .then(async () => await pingCheckCommand(interaction))
                        .catch((err) => {
                            if (interaction.deferred && !interaction.replied) {
                                if (err.name == "MongoNotConnectedError") {
                                    interaction.editReply({
                                        content: "Something went wrong with the database while processing your request.",
                                        ephemeral: true,
                                    })
                                    console.error("Database connection error: ", err)

                                } else {
                                    interaction.editReply({
                                        content: "Something went wrong while processing your request.",
                                        ephemeral: true,
                                    })
                                    console.error("Client error: ", err)
                                }
                            }
                        });
                    break;
                case "ping-append":
                    await databaseConnect()
                        .then(async () => await pingAppendCommand(interaction))
                        .catch((err) => {
                            if (interaction.deferred && !interaction.replied) {
                                if (err.name == "MongoNotConnectedError") {
                                    interaction.editReply({
                                        content: "Something went wrong with the database while processing your request.",
                                        ephemeral: true,
                                    })
                                    console.error("Database connection error: ", err)

                                } else {
                                    interaction.editReply({
                                        content: "Something went wrong while processing your request.",
                                        ephemeral: true,
                                    })
                                    console.error("Client error: ", err)
                                }
                            }
                        });
                    break;
                case "ping-remove":
                    await databaseConnect()
                        .then(async () => await pingRemoveCommand(interaction))
                        .catch((err) => {
                            if (interaction.deferred && !interaction.replied) {
                                if (err.name == "MongoNotConnectedError") {
                                    interaction.editReply({
                                        content: "Something went wrong with the database while processing your request.",
                                        ephemeral: true,
                                    })
                                    console.error("Database connection error: ", err)

                                } else {
                                    interaction.editReply({
                                        content: "Something went wrong while processing your request.",
                                        ephemeral: true,
                                    })
                                    console.error("Client error: ", err)
                                }
                            }
                        });
                case "ping-block":
                    await databaseConnect()
                        .then(async () => await pingBlockCommand(interaction))
                        .catch((err) => {
                            if (interaction.deferred && !interaction.replied) {
                                if (err.name == "MongoNotConnectedError") {
                                    interaction.editReply({
                                        content: "Something went wrong with the database while processing your request.",
                                        ephemeral: true,
                                    })
                                    console.error("Database connection error: ", err)

                                } else {
                                    interaction.editReply({
                                        content: "Something went wrong while processing your request.",
                                        ephemeral: true,
                                    })
                                    console.error("Client error: ", err)
                                }
                            }
                        });
                    break;
                case "ping-unblock":
                    await databaseConnect()
                        .then(async () => await pingUnblockCommand(interaction))
                        .catch((err) => {
                            if (interaction.deferred && !interaction.replied) {
                                if (err.name == "MongoNotConnectedError") {
                                    interaction.editReply({
                                        content: "Something went wrong with the database while processing your request.",
                                        ephemeral: true,
                                    })
                                    console.error("Database connection error: ", err)

                                } else {
                                    interaction.editReply({
                                        content: "Something went wrong while processing your request.",
                                        ephemeral: true,
                                    })
                                    console.error("Client error: ", err)
                                }
                            }
                        });
                    break;
                default:
                    console.error("Unknown command used: ", commandName);
            }
        } catch (err) {
            console.error("Error closing", err);
        } finally {
            await closeDatabase().catch(err => console.error("database closing error ", err)); // closes database
        }
    });

} catch (error) {
    console.error("Error running interaction: ", error);

}
async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function pingMessageCommand(interaction) {
    let newMessage = interaction.options._hoistedOptions[0].value; // Message stored as option string
    try {
        await interaction.deferReply({
            ephemeral: true,
        });
    } catch (error) {
        console.log(new Date().toLocaleString() + " Error found during deferring reply: " + error);
    }
    await updateUserMessage(interaction.guildId, interaction.user, newMessage) // update's message
        .then(async function () {
            await interaction.editReply({
                content: "Message Updated.",
                ephemeral: true
            })
        })
        .catch(async function (err) {
            await interaction.editReply({
                content: "Error occured when updating: " + err,
                ephemeral: true
            })

        });
}

async function pingHelpCommand(interaction) {
    const help = new EmbedBuilder()
        .setColor(0xf1f1f1)
        .setTitle(`All Commands`);
    // .setDescription("For the past 5 games.")
    exportedCommands.forEach((command) => {
        help.addFields({
            name: "/" + command.name,
            value: command.description,

        });
    });
    await interaction.deferReply({
        ephemeral: true,
    });

    await interaction.editReply({
        embeds: [help],
        ephemeral: true
    })
}

async function pingCommand(interaction) {
    try {
        await interaction.deferReply({
            ephemeral: true,
        }).catch((err) => {
            console.error(new Date().toLocaleString() + " Reply caught ", err)
        });

        let usersArr = await findUsers(interaction.guildId, interaction.user.id);
        //iterates through all the users to be pinged
        if (usersArr) {
            let userData = await dbClient
                .db("Ping-Bot")
                .collection(interaction.guildId)
                .findOne({
                    id: interaction.user.id,
                });
            for (const elem in usersArr.pingUsers) {
                let blockedList = await dbClient
                    .db("Ping-Bot")
                    .collection("block_list")
                    .findOne({
                        id: elem
                    })

                if (blockedList && blockedList.blockedUsers.includes(interaction.user.id)) {
                    console.log(`User ${elem} is blocked from ${interaction.user.username} and will not be pinged.`);
                    continue;
                }
                try {
                    new Promise(async (resolve) => {
                        // Finds their DM address
                        resolve(client.users.fetch(elem.toString()));
                    })
                        .then(async (user) => {
                            // Checks if is within limit
                            // if is within limit, proceed
                            // if it's not within limit, timeout for 5 seconds then try again
                            if (rateLimiterOK(interaction.user.id)) {
                                try {

                                    if (!user.bot) {
                                        console.log("Sending message to user: ", user.username);
                                        user.send(
                                            {
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setColor(0xf1f1f1)
                                                        .setTitle(userData.message + "\n\nhttps://discord.com/channels/" + interaction.guildId + "/" + interaction.channelId)
                                                        .setAuthor({
                                                            name: interaction.user.globalName,
                                                            iconURL: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}`
                                                        })
                                                        .setDescription("Click link to head there!")
                                                ]
                                            }).catch((err) => {
                                                console.error(`Error sending message to user ${user.username}\n `, err);
                                            });
                                    }
                                } catch (error) {
                                    console.error("Caught error when sending before rate limit was hit: ", error);
                                }
                            } else {
                                sleep(5000).then(() => {
                                    try {
                                        if (!user.bot) {
                                            console.log("Sending message to user: ", user.username);
                                            user.send(
                                                {
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor(0xf1f1f1)
                                                            .setTitle(userData.message)
                                                            .setAuthor({
                                                                name: user.globalName,
                                                                iconURL: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`
                                                            })
                                                            .setDescription(" ")
                                                    ]
                                                }).catch((err) => {
                                                    console.error(`Error sending message to user ${user.username}: `, err);
                                                });
                                        }
                                    } catch (error) {
                                        console.error("Caught error when sending after rate limit was hit: ", error);
                                    }
                                }).catch((err) => {
                                    console.error("Rate Limiter hit when sending message to user: ", err);
                                })
                            }
                        })
                        .catch((error) => {
                            console.error("Caught error when sending.", error);
                            interaction.editReply({
                                content: "Error: " + error,
                                ephemeral: true,
                            });
                        });
                } catch (err) {
                    console.error(`Error sending message to user: ${elem} \n`, err);
                }
            }
            try {

                await interaction.editReply({
                    content: "Sent!\n\nIf a user did not receive the message, they may have DM's disabled.",
                    ephemeral: true
                })
            } catch (error) {
                console.error(new Date().toLocaleString() + " Reply caught", error);
            }
        } else {
            await interaction.editReply({
                content: "No users to ping!. Create one using /ping-edit",
                ephemeral: true,
            })
        }
    } catch (error) {
        console.error("Error pinging: ", error);
        await interaction.editReply({
            content: "Error Pinging.\nTry again later." + error,
            ephemeral: true
        })
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

async function pingEditCommand(interaction) {
    await interaction.deferReply({
        ephemeral: true,
    });

    // TODO: validates the input to make sure the @ symbol is present 
    let message = interaction.options._hoistedOptions[0].value;
    let tempUsrArr = message.split(">").map((elem) => {
        return elem.trim().slice(2);
    });


    tempUsrArr.splice(-1, 1);

    // Makes sure there are no duplicates users ID's in the array
    let usersArr = new Set(tempUsrArr);


    // * checks to see if the message includes @everyone
    if (message.includes('@everyone')) {
        const guild = await client.guilds.fetch(interaction.guildId);
        const members = await guild.members.fetch();

        if (members) {
            let usrIDList = new Set();
            members.forEach(member => {
                !member.user.bot ? usrIDList.add(member.id) : null;
            })
            await updateUsers(interaction.guildId, interaction.user, [...usrIDList], interaction).then(async function () {
                console.log("Added @everyone successfully")

                await interaction.editReply({
                    content: "Updated users!",
                    ephemeral: true,
                })
            })
        } else {
            console.error("Unable to fetch members from guild using @everyone" + new Date().toLocaleString());

            await interaction.editReply({
                content: "Something went wrong. Please try again later.",
                ephemeral: true,
            })
        }
        // * checks if the users include roles
    } else if (message.includes("&")) {

        let currGuild = await client.guilds.fetch(interaction.guildId);
        let memFetch = await currGuild.members.fetch();
        // let listOfMembers = await currGuild.members.list();

        let usrList = new Set();
        usersArr.forEach(async function (elem) {
            if (elem.includes("&")) {
                let listMembers = interaction.guild.roles.cache.find((roles) => elem.substring(1) == roles.id).members

                let usrIDList = new Set();
                listMembers.map(usr => usrIDList.add(usr.id));
                usrList = usrIDList;

            } else {
                usrList.add(elem);
            }
        })
        await updateUsers(interaction.guildId, interaction.user, [...usrList], interaction).then(async function () {
            console.log("-Updated the users successfully 1, \n-Will now send the reply and close the DB")

            await interaction.editReply({
                content: "Updated users!",
                ephemeral: true,
            })
        }
        ).catch((err) => {
            console.error("Error updating users", err);
        });
        // * else updates the users in the database
    } else {
        await updateUsers(interaction.guildId, interaction.user, [...usersArr], interaction).then(
            async function () {
                console.log("-Updated the users successfully 2 , \n-Will now send the reply and close the DB")

                await interaction.editReply({
                    content: "Updated users!",
                    ephemeral: true,
                })
            }
        );
    }
}

async function pingCheckCommand(interaction) {
    let userID = interaction.user.id;
    try {
        await interaction.deferReply({
            ephemeral: true,
        });
        // Stores arrays of users with max 25 elements in each array
        let allUserArrPage = [];

        // Max 10 users in each array
        let maxUserArr = [];

        let userMap = await findUsers(interaction.guildId, userID);
        let userList = Object.keys(userMap.pingUsers);

        if (userList) {
            let messageEmbed = new EmbedBuilder()
                .setColor(0xf1f1f1)
                .setTitle("List of users waiting to be pinged!")
                .setFooter({ text: "Current message: \n" + userMap.message });

            const previous = new ButtonBuilder()
                .setCustomId("previous")
                .setLabel("Previous Page")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("⬅️")
                .setDisabled(true);
            const next = new ButtonBuilder()
                .setCustomId("next")
                .setLabel("Next Page")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("➡️")
            // .setDisabled(true);


            // Initialize the ActionRowBuilder to null
            // If the list of users exceeds 25, the buttons will be added in the message
            let row = null;

            // Keeps track of the pages for the list of users
            let currentPage = 0;

            // Keeps track of the number of users in the ping list
            let index = 0;



            let arrLength = userList.length;
            if (arrLength > 25) {
                messageEmbed.setDescription(`The list of users is too long! \nWill only show 25 users. \n\n(Current Size: **${arrLength}**).\n\0`);
                row = new ActionRowBuilder()
                    .addComponents(previous, next);
            }

            /**
             * 1. Loop through the list of users to ping once 
             * 2. Store the users within multiple arrays with max 10 elements
             * 3. Add the first 10 users to the embeded
             * 
             **/

            // ALTERNATIVE
            /** 
             * 1. Loops through the list of users
             * 2. Adds the users to the embeded message
             * 3. Once the embed message is sent, loop through the rest of the users
             * 4. Store the users in multiple arrays with max 10 elements in each array
             **/

            // Function to fetch and format a user entry
            async function fetchAndFormatUser(userID, index, messageEmbed, maxUserArr) {
                try {
                    let currUser = userMap.pingUsers[userID];
                    maxUserArr.push(userID);

                    messageEmbed.addFields({
                        name: currUser.guildName ? "Guild Nickname:" : "Username:",
                        value: `${index + 1}: ${currUser.guildName || currUser.globalName}`,
                    });

                } catch (error) {
                    console.error(`Error fetching user with ID ${userID}:`, error);
                }
            }

            async function fetchAndUpdateUser(userID, maxUserArr) {
                try {
                    maxUserArr.push(userID);
                } catch (error) {
                    console.error(`Error fetching user with ID ${userID}:`, error);
                }
            }



            // Fetch the first 10 users and send the initial reply
            for (let i = 0; i < Math.min(10, arrLength); i++) {
                await fetchAndFormatUser(userList[i], index, messageEmbed, maxUserArr);
                index++;
            }

            // Push the first page into `allUserArrPage`
            allUserArrPage.push([...maxUserArr]);
            maxUserArr.length = 0; // Clear `maxUserArr` for the next batch

            // Send the initial reply with buttons
            let btnInt;
            if (arrLength > 25) {
                btnInt = await interaction.editReply({
                    embeds: [messageEmbed],
                    components: [row],
                    ephemeral: true,
                });
            } else {
                btnInt = await interaction.editReply({
                    embeds: [messageEmbed],
                    ephemeral: true,
                });
            }

            // Set up the collector for pagination
            const confirm = btnInt.createMessageComponentCollector({ time: 1_200_000 });
            confirm.on('collect', async (click) => {
                switch (click.customId) {
                    case 'previous':
                        if (currentPage > 0) {
                            await click.deferUpdate();

                            if (currentPage > 0) {
                                if (currentPage == 1) {
                                    for (const elem of row.components) {
                                        if (elem.data.custom_id == "previous") {
                                            elem.setDisabled(true);
                                        }
                                    }
                                }
                                if (currentPage == allUserArrPage.length - 1) {
                                    for (const elem of row.components) {
                                        if (elem.data.custom_id == "next") {
                                            elem.setDisabled(false);
                                        }
                                    }

                                }


                                let prevEmbed = new EmbedBuilder()
                                    .setColor(0xf1f1f1)
                                    .setTitle("List of users waiting to be pinged!")
                                    .setFooter({ text: "Current message: \n" + userMap.message });

                                let inc = 0;
                                try {
                                    for (const usr of allUserArrPage[currentPage - 1]) {
                                        await fetchAndFormatUser(usr, (inc + ((currentPage - 1) * 10)), prevEmbed, maxUserArr);
                                        inc++;
                                    }
                                } catch (error) {
                                    console.error("Error fetching and formatting user: ", error);
                                }

                                try {

                                    await click.editReply({ embeds: [prevEmbed], components: [row], ephemeral: true });
                                } catch (err) {
                                    console.error("Error editing message via webhook: ", err);
                                }
                            }

                            currentPage--;
                        }
                        break;
                    case 'next':
                        await click.deferUpdate(); // Acknowledge the button click

                        if (currentPage < allUserArrPage.length - 1) {
                            if (currentPage == 0) {
                                for (const elem of row.components) {
                                    if (elem.data.custom_id == "previous") {
                                        elem.setDisabled(false);
                                    }
                                }
                            }

                            if (currentPage == allUserArrPage.length - 2) {
                                for (const elem of row.components) {
                                    if (elem.data.custom_id == "next") {
                                        elem.setDisabled(true);
                                    }
                                }

                            }


                            let prevEmbed = new EmbedBuilder()
                                .setColor(0xf1f1f1)
                                .setTitle("List of users waiting to be pinged!")
                                .setFooter({ text: "Current message: \n" + userMap.message });

                            let inc = 0;
                            for (const usr of allUserArrPage[currentPage + 1]) {
                                await fetchAndFormatUser(usr, (inc + ((currentPage + 1) * 10)), prevEmbed, maxUserArr);
                                inc++;
                            }
                            try {


                                await click.editReply({ embeds: [prevEmbed], components: [row], ephemeral: true });
                            } catch (err) {
                                console.error("Error editing message via webhook: ", err);
                            }
                            currentPage++;
                        } else {
                            for (const elem of row.components) {
                                if (elem.data.customId == "next") {
                                    elem.setDisabled(true);
                                }
                            }
                            await click.editReply({
                                components: [row],
                                ephemeral: true,
                            })
                        }
                        break;
                }
            });

            // Fetch the remaining users and paginate in batches of 10
            for (let i = index; i < arrLength; i++) {
                await fetchAndUpdateUser(userList[i], maxUserArr);

                // Group users into pages of 10
                if (maxUserArr.length === 10 || i === arrLength - 1) {
                    allUserArrPage.push([...maxUserArr]);
                    maxUserArr.length = 0; // Clear `maxUserArr` for the next batch

                    /**
                     * 1. Check if the next button is disabled
                     * 2. If it is, enable it
                     * 3. If it is not, do nothing
                     *   
                     * */
                    // let isDisabled = true;

                }

            }

        } else {
            await interaction.editReply({
                content: "User not found. Try to add users to ping, then try again.",
                ephemeral: true,
            });
        }
    } catch (error) {
        console.error('An error occurred when running the ping-check command:', error);
        await interaction.editReply({
            content: "An error occurred while processing your request.",
            ephemeral: true,
        });
    }
}

async function pingAppendCommand(interaction) {
    let userID = interaction.user.id;
    try {
        await interaction.deferReply({
            ephemeral: true,
        });
    } catch (err) {
        console.error("Error deferring reply", err);
    }
    /**
     * Pulls the users from the database
     * Checks if there are any duplicates
     * If not, $push into the database
      */
    try {
        let message = interaction.options._hoistedOptions[0].value;
        let tempUsrArr = message.split(">").map((elem) => {
            return elem.trim().slice(2);
        });
        tempUsrArr.splice(-1, 1);

        let arrOfUsers = new Set(tempUsrArr);

        let dbDoc = await findUsers(interaction.guildId, interaction.user.id);
        let prevUsers = Object.keys(dbDoc.pingUsers);


        // TODO: Check for @everyone

        // Checks if there are roles included in the list of users
        if (message.includes("&")) {

            let currGuild = await client.guilds.fetch(interaction.guildId);
            let memFetch = await currGuild.members.fetch();

            let usrList = new Set();
            [...arrOfUsers].forEach(async function (elem) {
                if (elem.includes("&")) {
                    let listMembers = interaction.guild.roles.cache.find((roles) => elem.substring(1) == roles.id).members
                    listMembers.map(usr => usrList.add(usr.id));

                } else {
                    usrList.add(elem);
                }
            })

            if (usrList && prevUsers) {
                let allUsers = new Set([...usrList, ...prevUsers]);
                let appended = await updateUsers(interaction.guildId, interaction.user, [...allUsers], interaction);
                if (appended.acknowledged) {
                    interaction.editReply({
                        content: "Appended users!",
                        ephemeral: true,
                    });
                } else {
                    console.error("Error appending users " + new Date().toLocaleString());
                    interaction.editReply({
                        content: "Something went wrong appending users.\nTry again later.",
                        ephemeral: true,
                    });
                }

            } else {
                console.error("Issue fetching users with roles or fetching previous users " + new Date().toLocaleString());
                console.error("Users with roles: ", usrList);
                console.error("Previous users: ", prevUsers);

                interaction.editReply({
                    content: "Retreival of previous users failed.\nTry again later.",
                    ephemeral: true,
                })
            }
        } else {
            // If no roles are included, then just append the users in the database
            let allUsers;
            if (prevUsers) {
                allUsers = new Set([...prevUsers, ...arrOfUsers]);
                let appended = await updateUsers(interaction.guildId, interaction.user, [...allUsers], interaction);
                if (appended.acknowledged) {
                    interaction.editReply({
                        content: "Appended users!",
                        ephemeral: true,
                    });
                } else {
                    console.error("Error appending users " + new Date().toLocaleString());
                    interaction.editReply({
                        content: "Something went wrong appending users.\nTry again later.",
                        ephemeral: true,
                    });
                }
            } else {
                console.error("Issue retreiving previous users in database for appending " + new Date().toLocaleString());

                interaction.editReply({
                    content: "Retreival of previous users failed.\nTry again later.",
                    ephemeral: true,
                })
            }
        }
    } catch (err) {
        console.error("Error appending users", err);

        try {
            interaction.editReply({
                content: "Error appending users.\nPlease try again later.",
            })
        } catch (error) {
            console.error("Error editing reply", error);
        }
    }
}

async function pingRemoveCommand(interaction) {
    let userID = interaction.user.id;

    try {
        await interaction.deferReply({
            ephemeral: true,
        });
    } catch (err) {
        console.error("Error deferring reply", err);
    }
    /**
     * Pulls the users from the database
     * Checks if there are any duplicates
     * If not, $push into the database
      */
    try {
        let message = interaction.options._hoistedOptions[0].value;
        let tempUsrArr = message.split(">").map((elem) => {
            return elem.trim().slice(2);
        });
        tempUsrArr.splice(-1, 1);

        // TODO: Check for roles and for @everyone

        let arrOfUsers = new Set(tempUsrArr);
        let doc = await findUsers(interaction.guildId, interaction.user.id);
        let prevUsers = new Set(Object.keys(doc.pingUsers));
        let foundUsers = new Set();

        if (arrOfUsers.size == 1) {
            if (prevUsers.delete([...arrOfUsers][0])) {
                foundUsers.add(arrOfUsers[0]);
            }
        } else {
            for (const user of arrOfUsers) {
                if (prevUsers.delete(user)) {
                    foundUsers.add(user);
                }
            }
        }

        if (foundUsers.size > 0) {
            try {
                let removed = await updateUsers(interaction.guildId, interaction.user, [...prevUsers], interaction);

                await interaction.editReply({
                    content: "Removed users successfully! \n\nRun /ping-check to see the updated list.",
                    ephemeral: true,
                });
            } catch (error) {
                console.error("Error removing users: ", error);
            }
        } else {
            await interaction.editReply({
                content: "Users not found in the list. Try again.",
                ephemeral: true,
            });
        }
    } catch (err) {
        console.error("Error removing users: ", err);
        await interaction.editReply({
            content: "An error has occured when processing your request.",
            ephemeral: true,
        });
    }
}

async function pingBlockCommand(interaction) {
    let userID = interaction.user.id;

    try {
        await interaction.deferReply({
            ephemeral: true,
        });
    } catch (err) {
        console.error("Error deferring reply", err);
    }

    // TODO: Validate the users are @'s 

    try {
        let message = interaction.options._hoistedOptions[0].value;
        let tempUsrArr = message.split(">").map((elem) => {
            return elem.trim().slice(2);
        });
        tempUsrArr.splice(-1, 1);

        let arrOfUsers = new Set(tempUsrArr);
        let doc = await findUsers(interaction.guildId, interaction.user.id);
        let prevBlockedUsers = new Set(Object.keys(doc.blockedUsers ? doc.blockedUsers : []));

        let allBlockedUsers = new Set([...prevBlockedUsers, ...arrOfUsers]);

        let blocked = await dbClient
            .db("Ping-Bot")
            .collection("block_list")
            .updateOne(
                {
                    id: interaction.user.id,
                },
                {
                    $set: {
                        lastModified: new Date().toLocaleString(),
                        blockedUsers: [...allBlockedUsers],
                    },
                }
            );
        if (blocked.matchedCount < 1) {
            let blockCreate = await dbClient
                .db("Ping-Bot")
                .collection("block_list")
                .insertOne(
                    {
                        id: interaction.user.id,
                        lastModified: new Date().toLocaleString(),
                        blockedUsers: [...allBlockedUsers],
                    },
                );
            console.log(blockCreate);

        } else if (blocked.acknowledged) {
            await interaction.editReply({
                content: "Blocked users successfully!",
                ephemeral: true,
            });
        }
        else {
            await interaction.editReply({
                content: "Error blocking users. Try again later.",
                ephemeral: true,
            });
            console.error("Error blocking users: ", blocked);

        }


    } catch (err) {
        console.error("Error blocking users: ", err);
        await interaction.editReply({
            content: "An error has occured when processing your request.",
            ephemeral: true,
        });
    }

}
async function pingUnblockCommand(interaction) {
    let userID = interaction.user.id;

    try {
        await interaction.deferReply({
            ephemeral: true,
        });
    } catch (err) {
        console.error("Error deferring reply", err);
    }

    // TODO: Validate the users are @'s 

    try {
        let message = interaction.options._hoistedOptions[0].value;
        let tempUsrArr = message.split(">").map((elem) => {
            return elem.trim().slice(2);
        });
        tempUsrArr.splice(-1, 1);

        let arrOfUsers = new Set(tempUsrArr);
        let doc = await dbClient.db("Ping-Bot").collection("block_list").findOne({ id: interaction.user.id });
        if (!doc) {
            await interaction.editReply({
                content: "No users to unblock!",
                ephemeral: true,
            })
        } else {
            let prevBlockedUsers = new Set(doc.blockedUsers != null ? [...doc.blockedUsers] : []);

            arrOfUsers.forEach(user => prevBlockedUsers.delete(user));

            let allBlockedUsers = [...prevBlockedUsers];

            let blocked = await dbClient
                .db("Ping-Bot")
                .collection("block_list")
                .updateOne(
                    {
                        id: interaction.user.id,
                    },
                    {
                        $set: {
                            lastModified: new Date().toLocaleString(),
                            blockedUsers: allBlockedUsers,
                        },
                    }
                );

            if (blocked.matchedCount < 1) {
                let blockCreate = await dbClient
                    .db("Ping-Bot")
                    .collection("block_list")
                    .insertOne(
                        {
                            id: interaction.user.id,
                            lastModified: new Date().toLocaleString(),
                            blockedUsers: [...allBlockedUsers],
                        },
                    );
                console.log(blockCreate);

            } else if (blocked.acknowledged) {
                await interaction.editReply({
                    content: "Blocked users successfully!",
                    ephemeral: true,
                });
            }
            else {
                await interaction.editReply({
                    content: "Error blocking users. Try again later.",
                    ephemeral: true,
                });
                console.error("Error blocking users: ", blocked);

            }
        }


    } catch (err) {
        console.error("Error blocking users: ", err);
        await interaction.editReply({
            content: "An error has occured when processing your request.",
            ephemeral: true,
        });
    }

}

// Login to Discord with your client's token
client.login(token);
