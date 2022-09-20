// Require the necessary discord.js classes
const { Client, Collection, Intents } = require("discord.js");
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
    console.log("Ready from discord.js!");
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
    try {
        await databaseConnect();
    } catch (error) {
        interaction.reply({
            content: "Error connecting to database. Try again later",
            ephemeral: true,
        });
    }

    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === "ping") {
        try {
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
                    new Promise((resolve) => {
                        // Finds their DM address
                        resolve(client.users.fetch(elem));
                    })
                        .then((user) => {
                            if (!user.bot) {
                                user.send(userMessage.message);
                            }
                        })
                        .catch((error) => {
                            console.error("Caught error when sending.", error);
                            console.error(error);
                            interaction.reply({
                                content: "Error: " + error,
                                ephemeral: true,
                            });
                        });
                });
                interaction.reply({
                    content: "Sent!",
                    ephemeral: true,
                });
            } else {
                interaction.reply({
                    content: "No users to ping!. Create one using /ping-edit",
                    ephemeral: true,
                });
            }
        } catch (error) {
            interaction.reply({
                content: "Error Pinging. Try again later." + error,
                ephemeral: true,
            });
        }
    } else if (commandName === "ping-edit") {
        let message = interaction.options._hoistedOptions[0].value,
            usersArr = message.split(">").map((elem) => {
                return elem.trim().slice(3);
            });
        usersArr.splice(-1, 1);
        // TODO: Add roles search
        await updateUsers(interaction.guildId, interaction.user, usersArr).then(
            () =>
                interaction.reply({
                    content: "Updated users!",
                    ephemeral: true,
                })
        );
    } else if (commandName === "ping-help") {
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
        interaction.reply({
            embeds: [help],
        });
    } else if (commandName === "ping-message") {
        let newMessage = interaction.options._hoistedOptions[0].value; // Message stored as option string
        await updateUserMessage(interaction.guildId, interaction.user, newMessage) // update's message
            .then(() => {
                interaction.reply({
                    content: "Message Updated.",
                    ephemeral: true,
                });
            })
            .catch((err) => {
                interaction.reply({
                    content: "Error occured when updating: " + err,
                    ephemeral: true,
                });
            });
    }

    await closeDatabase(); // closes database
});

// Login to Discord with your client's token
client.login(token);