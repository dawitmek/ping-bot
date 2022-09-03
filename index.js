// Require the necessary discord.js classes
const fs = require('node:fs');
const { Client, Collection, Intents } = require('discord.js');
const { token } = require('./config.json');
const { log } = require('node:console');

const rawObj = fs.readFileSync('./storage.json');
const objStorage = JSON.parse(rawObj);

// Create a new client instance Discord.js
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"] });

client.commands = new Collection();

// When the client is ready, run this code (only once) Discord.js
client.once('ready', () => {
    console.log('Ready from discord.js!');
    client.user.setActivity("Your mother", { type: "PLAYING" });
});


client.on("messageCreate", (message) => {
    if (message.author.bot) return false;
    // '633454718005280788'.send('brr');
    // const user = await client.users.fetch('id');
    // user.send('content');

});
//	Discord.js
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'ping') {
        if (!objStorage[interaction.guildId]) {
            objStorage[interaction.guildId] = {};
        }

        if (objStorage[interaction.guildId][interaction.user.id]) {
            let usersArr = objStorage[interaction.guildId][interaction.user.id];
            let channel = client.channels.cache.get(interaction.channelId);
            usersArr.forEach(elem => {

                new Promise((resolve) => {
                    resolve(client.users.fetch(elem));
                }).then((user) => {
                    if (!user.bot) {
                        user.send(`${interaction.user.username} is currently in the call!`);
                    } else {
                        channel.send("You can't ping a bot!");
                        throw(new Error('Tryed to ping a bot'));
                    }
                }).then(() => {
                    interaction.reply({ content: 'Sent!', ephemeral: true });
                })
                
                .catch((error) => {
                    console.log(error)
                })

            })
        } else {
            objStorage[interaction.guildId][interaction.user.id] = '';
            interaction.reply({ content: 'Enter the @\'s you want to ping.', ephemeral: true }).then(() => {
                const filter = m => interaction.user.id === m.author.id;

                interaction.channel.awaitMessages({ filter, time: 60000, max: 1, errors: ['time'] })
                    .then(messages => {
                        let usersArr = messages.first().content.split('>').map(elem => {
                            return elem.trim().slice(2);
                        });
                        usersArr.splice(-1, 1);
                        objStorage[interaction.guildId][interaction.user.id] = usersArr;
                        interaction.followUp({ content: 'Sent!', ephemeral: true });
                        usersArr.forEach(elem => {

                            new Promise((resolve) => {
                                resolve(client.users.fetch(elem));
                            }).then((user) => {
                                user.send(`${interaction.user.username} is currently in the call!`);
                            }).catch((error) => {
                                interaction.reply({ content: `There was an error: ${error} `, ephemeral: true })
                            })
                        })
                        fs.writeFileSync('./storage.json', JSON.stringify(objStorage, null, 2))
                    }).catch(() => interaction.followUp('You didn\'t enter any input.'));
            })
        }
    } else if (commandName === 'ping-edit') {
        interaction.reply({ content: 'Enter the new usernames to ping.', ephemeral: true }).then(() => {
            const filter = m => interaction.user.id === m.author.id;

            interaction.channel.awaitMessages({ filter, time: 60000, max: 1, errors: ['time'] })
                .then(messages => {
                    let usersArr = messages.first().content.split('>').map(elem => {
                        return elem.trim().slice(2);
                    });
                    usersArr.splice(-1, 1);

                    objStorage[interaction.guildId][interaction.user.id] = usersArr;

                    fs.writeFileSync('./storage.json', JSON.stringify(objStorage, null, 2))
                    interaction.followUp({ content: 'Edited!', ephemeral: true });
                })
        })
    } else if(commandName === 'ping-help') {
        const message = interaction.options.getString('message');
        interaction.reply(message);
    }
});



// Login to Discord with your client's token
client.login(token);
