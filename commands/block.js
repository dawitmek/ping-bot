const { SlashCommandBuilder } = require('@discordjs/builders');
const lib = require('../external-functions.js');

module.exports = {
    data: new SlashCommandBuilder().setName('ping-block')
        .setDescription('Block a user from pinging you.').addStringOption(option =>
            option.setName('usernames')
                .setDescription('Include @Users or @Roles')
                .setRequired(true)),
    async execute(interaction, client) {
        let userID = interaction.user.id;

        

        // TODO: Validate the users are @'s 

        try {
            let message = interaction.options._hoistedOptions[0].value;
            let tempUsrArr = message.split(">").map((elem) => {
                return elem.trim().slice(2);
            });
            tempUsrArr.splice(-1, 1);

            let arrOfUsers = new Set(tempUsrArr);
            let doc = await lib.findUsers(interaction.guildId, interaction.user.id);
            let prevBlockedUsers = new Set(Object.keys(doc.blockedUsers ? doc.blockedUsers : []));

            let allBlockedUsers = new Set([...prevBlockedUsers, ...arrOfUsers]);

            let blocked = await lib.dbClient
                .db("Ping-Bot")
                .collection("block_list")
                .updateOne(
                    {
                        id: interaction.user.id,
                    },
                    {
                        $set: {
                            lastModified: new Date().toLocaleString(),
                            blockedUsers: [...allBlockedUsers],
                        },
                    }
                );

            // Creates a database entry if there is no entry to update
            if (blocked.matchedCount < 1) {
                let blockCreate = await lib.dbClient
                    .db("Ping-Bot")
                    .collection("block_list")
                    .insertOne(
                        {
                            id: interaction.user.id,
                            lastModified: new Date().toLocaleString(),
                            blockedUsers: [...allBlockedUsers],
                        },
                    );
                console.log("Created a new block for user " + interaction.user.username);

                await interaction.editReply({
                    content: "Blocked users successfully!",
                    ephemeral: true,
                })

            } else if (blocked.acknowledged) {
                await interaction.editReply({
                    content: "Blocked users successfully!",
                    ephemeral: true,
                });
            }
            else {
                await interaction.editReply({
                    content: "Error blocking users. Try again later.",
                    ephemeral: true,
                });
                console.error("Error blocking users: ", blocked);
            }

        } catch (err) {
            console.error("Error blocking users: ", err);
            await interaction.editReply({
                content: "An error has occured when processing your request.",
                ephemeral: true,
            });
        }
    }
}