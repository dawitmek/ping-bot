const { SlashCommandBuilder } = require('@discordjs/builders');
const lib = require('../external-functions.js');

module.exports = {
    data: new SlashCommandBuilder().setName('ping-remove').setDescription('Remove individual users from your ping list!').addStringOption(option =>
        option.setName('usernames')
            .setDescription('Users you would like to remove from your ping list. ONLY INCLUDE @\'s')
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

            // TODO: Check for roles and for @everyone

            let arrOfUsers = new Set(tempUsrArr);
            let doc = await lib.findUsers(interaction.guildId, interaction.user.id);
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
                    let removed = await lib.updateUsers(interaction.guildId, interaction.user, [...prevUsers], interaction);

                    await interaction.editReply({
                        content: "Removed users successfully! \n\nRun `/ping-check` to see the updated list.",
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
}