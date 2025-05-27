const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('block_edit')
        .setDescription('Check who you have blocked'),
    async execute(interaction) {
        
        await interaction.reply('User has been blocked from editing messages.');
    },
};