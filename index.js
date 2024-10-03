// Require the necessary discord.js classes
const { Client, Collection, Intents, Guild, GuildChannel, GatewayIntentBits } = require("discord.js");
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
                message: `User ${user.username} is pinging you!`,
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
                    message: `${user.username}: ${newMessage}`,
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
    try {

        switch (commandName) {
            case "ping":
                await databaseConnect()
                    .then(() => pingCommand(interaction))
                    .catch((err) => console.error("Database connection error: ", err));
                break;
            case "ping-edit":
                await databaseConnect()
                    .then(() => pingEditCommand(interaction))
                    .catch((err) => console.error("Database connection error: ", err));
                break;
            case "ping-help":
                await databaseConnect()
                    .then(() => pingHelpCommand(interaction))
                    .catch((err) => console.error("Database connection error: ", err));
                break;
            case "ping-message":
                await databaseConnect()
                    .then(async () => await pingMessageCommand(interaction))
                    .catch((err) => console.error("Database connection error: ", err));
                break;
            case "ping-check":
                await databaseConnect()
                    .then(async () => await pingCheckCommand(interaction))
                    .catch((err) => console.error("Database connection error: ", err));
                break;
            case "ping-append":
                await databaseConnect()
                    .then(async () => await pingAppendCommand(interaction))
                    .catch((err) => console.error("Database connection error: ", err));
                break;
            case "ping-remove":
                await databaseConnect()
                    .then(async () => await pingRemoveCommand(interaction))
                    .catch((err) => console.error("Database connection error: ", err));
                break;
            default:
                console.log("Unknown command");
        }
    } catch (err) {
        console.error("Error closing", err);
    } finally {
        await closeDatabase().catch(err => console.error("database closing error ", err)); // closes database
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
            let userMessage = await dbClient
                .db("Ping-Bot")
                .collection(interaction.guildId)
                .findOne({
                    id: interaction.user.id,
                });
            for (const elem of usersArr.pingUsers) {

                try {
                    new Promise(async (resolve) => {
                        // Finds their DM address
                        resolve(client.users.fetch(elem.toString()));
                    })
                        .then((user) => {
                            if (!user.bot) {
                                console.log("Sending message to user: ", user.username);
                                user.send(
                                    {
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor(0xf1f1f1)
                                                .setTitle(userMessage.message)
                                                .setAuthor({
                                                    name: user.globalName,
                                                    iconURL: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`
                                                })
                                                .setDescription(" ")
                                        ]
                                    });
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


    // searches if the user is a role
    // else, updates DB as the users
    if (message.includes('@everyone')) {
        const guild = await client.guilds.fetch(interaction.guildId);
        const members = await guild.members.fetch();

        if (members) {
            let usrIDList = new Set();
            members.forEach(member => {
                !member.user.bot ? usrIDList.add(member.id) : null;
            })
            await updateUsers(interaction.guildId, interaction.user, [...usrIDList]).then(async function () {
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
                // console.log("list: " + usrList);
                // console.log("Guild ID: " + interaction.guildId, "User: " + interaction.user);
            } else {
                usrList.add(elem);
            }
        })
        await updateUsers(interaction.guildId, interaction.user, [...usrList]).then(async function () {
            console.log("-Updated the users successfully 1, \n-Will now send the reply and close the DB")

            await interaction.editReply({
                content: "Updated users!",
                ephemeral: true,
            })
        }
        ).catch((err) => {
            console.error("Error updating users", err);
        });
    } else {
        await updateUsers(interaction.guildId, interaction.user, [...usersArr]).then(
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

        let userList = await findUsers(interaction.guildId, userID);

        if (userList) {
            let messageEmbed = new EmbedBuilder()
                .setColor(0xf1f1f1)
                .setTitle("List of users waiting to be pinged!")
                .setFooter({text: "Current message: \n" + userList.message});
            let index = 0;

            let arrLength = userList.pingUsers.length;
            if (arrLength > 25) {
                messageEmbed.setDescription(`The list of users is too long! \nWill only show 25 users. \n\n(Current Size: **${arrLength}**).\n\0`);
            }
            // Use a for...of loop to handle async operations properly
            for (const userID of userList.pingUsers) {
                try {
                    let uname = await client.users.fetch(userID);

                    if (index >= 25) {
                        break;
                    }

                    if (uname) {
                        let guildMember = await interaction.guild.members.fetch(userID);
                        let guildname = guildMember.nickname;

                        if (guildname == null) {
                            messageEmbed.addFields({
                                name: "Guild Name: No Guild Name Found",
                                value: "Handle: " + uname.username,
                            });
                        } else {
                            messageEmbed.addFields({
                                name: "Guild Name: " + guildname,
                                value: "Handle: " + uname.username,
                            });
                        }
                    }
                    index++;
                } catch (error) {
                    console.error(`Error fetching user with ID ${userID}:`, error);
                    // Optionally, you can add a field to indicate an error occurred for this user
                }
            }

            // After collecting all users, send the embed once
            await interaction.editReply({
                embeds: [messageEmbed],
                ephemeral: true,
            });
        } else {
            await interaction.editReply({
                content: "User not found. Try to add users to ping, then try again.",
                ephemeral: true,
            });
        }
    } catch (error) {
        console.error('An error occurred:', error);
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
        let prevUsers = dbDoc.pingUsers;

        // Checks if there are roles included in the list of users
        if ([...arrOfUsers].find((elem) => elem.includes("&")) != null) {

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
                let appended = await dbClient
                    .db("Ping-Bot")
                    .collection(interaction.guildId)
                    .updateOne(
                        {
                            id: interaction.user.id,
                        },
                        {
                            $set: {
                                pingUsers: [...allUsers],
                            },
                        }
                    );
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
                let appended = await dbClient
                    .db("Ping-Bot")
                    .collection(interaction.guildId)
                    .updateOne(
                        {
                            id: interaction.user.id,
                        },
                        {
                            $set: {
                                pingUsers: [...allUsers],
                            },
                        }
                    );
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

        let arrOfUsers = new Set(tempUsrArr);
        let doc = await findUsers(interaction.guildId, interaction.user.id);
        let prevUsers = new Set(await doc.pingUsers);
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
            await dbClient
                .db("Ping-Bot")
                .collection(interaction.guildId)
                .updateOne(
                    {
                        id: interaction.user.id,
                    },
                    {
                        $set: {
                            pingUsers: [...prevUsers],
                        },
                    }
                );

            await interaction.editReply({
                content: "Removed users successfully! \n\nRun /ping-check to see the updated list.",
                ephemeral: true,
            });
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

// Login to Discord with your client's token
client.login(token);
