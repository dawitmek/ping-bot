const { SlashCommandBuilder } = require('@discordjs/builders');
const lib = require('../external-functions.js');
const { EmbedBuilder } = require("@discordjs/builders");
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');


module.exports = {
    data: new SlashCommandBuilder().setName('ping-check')
        .setDescription('Check which users you have set to ping!'),
    async execute(interaction, client) {
        let userID = interaction.user.id;
        try {

            // Stores arrays of users with max 25 elements in each array
            let allUserArrPage = [];

            // Max 10 users in each array
            let maxUserArr = [];

            let userMap = await lib.findUsers(interaction.guildId, userID);
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
}