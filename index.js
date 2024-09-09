// Require the necessary discord.js classes
const { Client, Collection, Intents, Guild, GuildChannel } = require("discord.js");
const { MongoClient } = require("mongodb");
const { MessageEmbed } = require("discord.js");
const token = process.env.PINGBOTTOKEN;
const dbClient = new MongoClient(process.env.MongoClient);
const exportedCommands = require("./deploy-commands.js");

// Create a new client instance Discord.js
const client = new Client({
    intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"],
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

async function updateUsers(guild, user, newUsers) {
    // finds and updates users to ping
    let replaced = await dbClient
        .db("Ping-Bot")
        .collection(guild)
        .updateOne(
            {
                id: user.id,
            },
            {
                $set: {
                    pingUsers: newUsers,
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
                pingUsers: newUsers,
                message: `User ${user.username} is in the call`,
                pinged_server: guild
            });
    } else return replaced;

    //**************************** Tried to check for bots here *******************

    // newUsers.forEach(user => {
    //     fetchUser(user)
    //         .then((userCheck) => {
    //             try {
    //                 if (userCheck.bot) {
    //                     throw new Error('BOTPINGERROR: Tried to ping a bot');
    //                 }
    //             } catch (error) {
    //                 return error;
    //             }
    //         })
    // })

    //********************************************************************* */
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
                    message: `From User ${user.username}: ${newMessage}`,
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
client.on("interactionCreate", async (interaction) => {
    //  ************************ connect to database ************************
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === "ping") {

        await databaseConnect()
            .then(() => pingCommand(interaction))
            .catch((err) => console.error("Database connection error: ", err));

    } else if (commandName === "ping-edit") {

        await databaseConnect()
            .then(() => pingEditCommand(interaction))
            .catch((err) => console.error("Database connection error: ", err))

    } else if (commandName === "ping-help") {

        await databaseConnect()
            .then(() => pingHelpCommand(interaction))
            .catch((err) => console.error("Database connection error: ", err))

    } else if (commandName === "ping-message") {

        await databaseConnect()
            .then(async () => await pingMessageCommand(interaction))
            .catch((err) => console.error("Database connection error: ", err))
    } else if (commandName === "ping-check") {
        await databaseConnect()
            .then(async () => await pingCheckCommand(interaction))
            .catch((err) => console.error("Database connection error: ", err))

    }

    try {
        await closeDatabase(); // closes database
    } catch (err) {
        console.error("Error closing", err);
    }
});

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
    const help = new MessageEmbed()
        .setColor("#f1f1f1")
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
            let userMessage = await dbClient
                .db("Ping-Bot")
                .collection(interaction.guildId)
                .findOne({
                    id: interaction.user.id,
                });
            usersArr.pingUsers.forEach((elem) => {
                new Promise(async (resolve) => {
                    // Finds their DM address
                    resolve(client.users.fetch(elem.toString()));
                })
                    .then((user) => {
                        if (!user.bot) {
                            user.send(
                                {
                                    embeds: [new MessageEmbed()
                                        .setColor("#f1f1f1")
                                        .setTitle(userMessage.message)
                                        .setAuthor({
                                            name: interaction.client.user.username,
                                            iconURL: `https://cdn.discordapp.com/avatars/${interaction.client.user.id}/${interaction.client.user.avatar}`
                                        })
                                        .setDescription(" ")
                                    ]
                                });
                        }
                    })
                    .catch((error) => {
                        console.error("Caught error when sending.", error);
                        interaction.reply({
                            content: "Error: " + error,
                            ephemeral: true,
                        });
                    });
            });
            try {

                await interaction.editReply({
                    content: "Sent!",
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
        await interaction.deferReply({
            ephemeral: true,
        });
        await interaction.editReply({
            content: "Error Pinging. Try again later." + error,
            ephemeral: true
        })
    }
}

async function pingEditCommand(interaction) {
    let message = interaction.options._hoistedOptions[0].value,
        usersArr = message.split(">").map((elem) => {
            return elem.trim().slice(2);
        });
    usersArr.splice(-1, 1);
    // TODO: Add roles search
    await updateUsers(interaction.guildId, interaction.user, usersArr).then(
        async function () {
            await interaction.deferReply({
                ephemeral: true,
            });
            await interaction.editReply({
                content: "Updated users!",
                ephemeral: true,
            })
        }
    );
}

async function pingCheckCommand(interaction) {
    let userID = interaction.user.id;
    try {
        await interaction.deferReply({
            ephemeral: true,
        });
        let userList = await findUsers(interaction.guildId, userID);
        if (userList) {
            let messageEmbed = new MessageEmbed()
                .setColor("#f1f1f1")
                .setTitle("List of users waiting to be pinged!")

            userList.pingUsers.forEach(async (userID) => {
                // console.log((await interaction.guild.members.fetch(userID)).nickname)
                let uname = await client.users.fetch(userID);

                if (uname) {
                    let guildname = (await interaction.guild.members.fetch(userID)).nickname
                    messageEmbed.addFields({
                        value: "Handle: " + uname.username,
                        name: "Guild Name: " + guildname,
                    })
                }
                await interaction.editReply({
                    embeds: [messageEmbed],
                    ephemeral: true,
                })
            });

            await interaction.editReply({
                embeds: [messageEmbed],
                ephemeral: true,
            })

        } else {
            await interaction.editReply({
                content: "User not founds. Try to add users to ping then try again.",
                ephemeral: true,
            })
        }
    } catch (error) {
    }
}

// Login to Discord with your client's token
client.login(token);
