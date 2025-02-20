const { SlashCommandBuilder } = require('@discordjs/builders');
const lib = require('../external-functions.js');

module.exports = {
    data: new SlashCommandBuilder().setName('ping-edit').setDescription('Edits collection of users')
        .addStringOption(option =>
            option.setName('add-users')
                .setDescription('Add/Change multiple users to ping. ADD ALL @\'s')
                .setRequired(true)),
    async execute(interaction, client) {
        

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
                await lib.updateUsers(interaction.guildId, interaction.user, [...usrIDList], interaction).then(async function () {
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
            await lib.updateUsers(interaction.guildId, interaction.user, [...usrList], interaction).then(async function () {
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
            await lib.updateUsers(interaction.guildId, interaction.user, [...usersArr], interaction).then(
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
}