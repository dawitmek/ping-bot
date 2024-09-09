const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const token = process.env.PINGBOTTOKEN;
const clientId = process.env.PingClient;

const commands = [
	new SlashCommandBuilder().setName('ping').setDescription('Pings users that you are in the call. (Pinging bots will stop the pings)'),
	new SlashCommandBuilder().setName('ping-edit').setDescription('Edits collection of users')
		.addStringOption(option =>
			option.setName('add-users')
				.setDescription('Add/Change multiple users to ping. ADD ALL @\'s')
				.setRequired(true)),
	new SlashCommandBuilder().setName('ping-help').setDescription('Know all the commands of the bot!'),
	new SlashCommandBuilder().setName('ping-message').setDescription('Update the message you want to send!')
		.addStringOption(option =>
			option.setName('edit-message')
				.setDescription('Edits message the bot sends to users you ping')
				.setRequired(true)),
	new SlashCommandBuilder().setName('ping-check').setDescription('Check which users you have set to ping!')
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(
	Routes.applicationCommands(clientId),
	{ body: commands },
);

module.exports = commands;