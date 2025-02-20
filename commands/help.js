const { SlashCommandBuilder } = require('@discordjs/builders');
const lib = require('../external-functions.js');
const { EmbedBuilder } = require("@discordjs/builders");
const { Collection } = require("discord.js");
const path = require('node:path');
const fs = require('node:fs');

module.exports = {
    data: new SlashCommandBuilder().setName('ping-help')
        .setDescription('Know all the commands of the bot!'),
    async execute(interaction, client) {
        const help = new EmbedBuilder()
            .setColor(0xf1f1f1)
            .setTitle(`All Commands`);

        let commands = [];

        const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(__dirname, file);
            const command = require(filePath);
            commands.push(command.data.toJSON());
        }

        commands.sort((a, b) => {
            a.name.split('-')
            
            
            return a.name
        })

        commands.forEach((command) => {
            help.addFields({
                name: "/" + command.name,
                value: command.description,

            });
        });


        await interaction.editReply({
            embeds: [help],
            ephemeral: true
        })
    }
}