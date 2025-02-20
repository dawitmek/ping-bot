const { SlashCommandBuilder } = require('@discordjs/builders');
const lib = require('../external-functions.js');
const { EmbedBuilder } = require("@discordjs/builders");


module.exports = {
    data: new SlashCommandBuilder().setName('ping')
        .setDescription('Sends a message to the users in your ping list'),
    async execute(interaction, client) {
        try {
            
            let usersArr = await lib.findUsers(interaction.guildId, interaction.user.id);
            //iterates through all the users to be pinged
            if (usersArr) {
                let userData = await lib.dbClient
                    .db("Ping-Bot")
                    .collection(interaction.guildId)
                    .findOne({
                        id: interaction.user.id,
                    });
                for (const elem in usersArr.pingUsers) {
                    let blockedList = await lib.dbClient
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
                                if (lib.rateLimiterOK(interaction.user.id)) {
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
}