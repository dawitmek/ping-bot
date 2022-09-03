// Require the necessary discord.js classes
const fs = require('node:fs');
const {
    Client,
    Collection,
    Intents
} = require('discord.js');
const {
    log
} = require('node:console');

const {
    MongoClient
} = require('mongodb');
const {
    LOADIPHLPAPI
} = require('node:dns');

const token = process.env.PINGBOTTOKEN;

const dbClient = new MongoClient(process.env.MongoClient);


// Create a new client instance Discord.js
const client = new Client({
    intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"]
});

client.commands = new Collection();

// When the client is ready, run this code (only once) Discord.js
client.once('ready', () => {
    console.log('Ready from discord.js!');
    client.user.setActivity("Friends", {
        type: "WATCHING"
    });
});


client.on("messageCreate", (message) => {
    if (message.author.bot) return false;
});

async function findUsers(guild, user) {
    try {
        return await dbClient.db('Ping-Bot').collection(guild).findOne({
            id: user
        });
    } catch (error) {
        console.error(error);
        // throw(new Error('Couldn\'t find users'));
    }
}

async function updateUsers(guild, user, newUsers) {
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

    // trys to find & replace existing ping users 
    let replaced = await dbClient.db('Ping-Bot').collection(guild).replaceOne({
        id: user
    }, {
        id: user,
        pingUsers: newUsers
    });
    console.log(replaced);
    // if replace returns error, creates document
    if (!replaced.upsertedId) {
        return await dbClient.db('Ping-Bot').collection(guild).insertOne({
            id: user,
            pingUsers: newUsers
        });
    } else
        return replaced;
}

async function fetchUser(user) {
    return await client.users.fetch(user);
}
async function databaseConnect() {
    await dbClient.connect();
}
async function closeDatabase() {
    await dbClient.close();
}
//	Discord.js
client.on('interactionCreate', async interaction => {
    //  ************************ connect to database ************************
    try {
        await databaseConnect();
    } catch (error) {
        interaction.reply({
            content: "Error connecting to database. Try again later",
            ephemeral: true
        });
    }

    if (!interaction.isCommand()) return;

    const {
        commandName
    } = interaction;

    if (commandName === 'ping') {
        try {
            let usersArr = await findUsers(interaction.guildId, interaction.user.id);
            //iterates through all the users to be pinged
            if (usersArr) {
                usersArr.pingUsers.forEach(elem => {
                    new Promise((resolve) => {
                            // Finds their DM address
                            resolve(client.users.fetch(elem));
                        }).then((user) => {
                            if (!user.bot) {
                                user.send(`${interaction.user.username} is currently in the call!`);
                            } else {
                                interaction.reply({
                                    content: "You can't ping a bot!",
                                    ephemeral: true
                                });
                                throw (new Error('Tryed to ping a bot'));
                            }
                        })
                        .catch((error) => {
                            console.error(error)
                        })
                        .then(() => {
                            interaction.reply({
                                content: 'Sent!',
                                ephemeral: true
                            });
                        })

                })
            } else {
                interaction.reply({
                    content: 'No users to ping!. Create one using /ping-edit',
                    ephemeral: true
                })
            }
        } catch (error) {
            interaction.reply({
                content: 'Error Pinging. Try again later.' + error,
                ephemeral: true
            });
        }
    } else if (commandName === 'ping-edit') {
        let message = interaction.options._hoistedOptions[0].value;
        let usersArr = message.split('>').map(elem => {
            return elem.trim().slice(3);
        });
        usersArr.splice(-1, 1);
        await updateUsers(interaction.guildId, interaction.user.id, usersArr)
            .then(() => interaction.reply({
                content: 'Updated users!',
                ephemeral: true
            }))



    } else if (commandName === 'ping-help') {
        const message = interaction.options.getString('message');
        interaction.reply(message);
    }

    // ************************ close database ************************
    await closeDatabase();
});


// Login to Discord with your client's token
client.login(token);