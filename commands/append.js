const { SlashCommandBuilder } = require('@discordjs/builders');
const lib = require('../external-functions.js');


module.exports = {
    data: new SlashCommandBuilder().setName('ping-append').setDescription('Append new users to the existing list of users you ping!').addStringOption(option =>
        option.setName('new-users')
            .setDescription('New users to append to the list of users you ping. ONLY INCLUDE @\'s')
            .setRequired(true)),
    async execute(interaction, client) {
        let userID = interaction.user.id;
        
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

            let dbDoc = await lib.findUsers(interaction.guildId, interaction.user.id);
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
                    let appended = await lib.updateUsers(interaction.guildId, interaction.user, [...allUsers], interaction);
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
                    let appended = await lib.updateUsers(interaction.guildId, interaction.user, [...allUsers], interaction);
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
}