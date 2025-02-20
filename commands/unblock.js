const { SlashCommandBuilder } = require('@discordjs/builders');
const lib = require('../external-functions.js');

module.exports = {
    data: new SlashCommandBuilder().setName('ping-unblock').setDescription('Block a user from pinging you.').addStringOption(option =>
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
            let doc = await lib.dbClient.db("Ping-Bot").collection("block_list").findOne({ id: interaction.user.id });
            if (!doc || doc.blockedUsers == null) {
                await interaction.editReply({
                    content: "No users to unblock!",
                    ephemeral: true,
                })
            } else {
                let prevBlockedUsers = new Set(doc.blockedUsers != null ? [...doc.blockedUsers] : []);
                let found = false;
                arrOfUsers.forEach(user => {
                    found = prevBlockedUsers.delete(user);
                });

                let allBlockedUsers = [...prevBlockedUsers];

                if (found) {
                    let unblocked = await lib.dbClient
                        .db("Ping-Bot")
                        .collection("block_list")
                        .updateOne(
                            {
                                id: interaction.user.id,
                            },
                            {
                                $set: {
                                    lastModified: new Date().toLocaleString(),
                                    blockedUsers: allBlockedUsers,
                                },
                            }
                        );
                    if (doc.blockedUsers.length == 0) {
                        await interaction.editReply({
                            content: "Block list is empty!",
                            ephemeral: true,
                        });

                    } else if (unblocked.acknowledged) {
                        await interaction.editReply({
                            content: "Unblocked users successfully!",
                            ephemeral: true,
                        });
                    }
                    else {
                        await interaction.editReply({
                            content: "Error blocking users. Try again later.",
                            ephemeral: true,
                        });
                        console.error("Error blocking users: ", unblocked);
                    }
                } else {
                    await interaction.editReply({
                        content: "Users not found in the block list.",
                        ephemeral: true,
                    });
                }
            }

        } catch (err) {
            console.error("Error unblocking users: ", err);
            await interaction.editReply({
                content: "An error has occured when processing your request.",
                ephemeral: true,
            });
        }
    }
}