const { SlashCommandBuilder } = require('@discordjs/builders');
const lib = require('../external-functions.js');

module.exports = {
    data: new SlashCommandBuilder().setName('ping-message').setDescription('Update the message you want to send!')
        .addStringOption(option =>
            option.setName('edit-message')
                .setDescription('Edits message the bot sends to users you ping')
                .setRequired(true)),
    async execute(interaction, client) {
        let newMessage = interaction.options._hoistedOptions[0].value; // Message stored as option string
        try {
            
        } catch (error) {
            console.log(new Date().toLocaleString() + " Error found during deferring reply: " + error);
        }
        
        await lib.updateUserMessage(interaction.guildId, interaction.user, newMessage) // update's message
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
}