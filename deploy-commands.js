const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const token = process.env.PINGBOTTOKEN;
const clientId = process.env.PingClient;

const commands = [
	new SlashCommandBuilder().setName('ping').setDescription('Sends a message to the users in your ping list'),
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
	new SlashCommandBuilder().setName('ping-check').setDescription('Check which users you have set to ping!'),
	new SlashCommandBuilder().setName('ping-append').setDescription('Append new users to the existing list of users you ping!').addStringOption(option =>
		option.setName('new-users')
			.setDescription('New users to append to the list of users you ping. ONLY INCLUDE @\'s')
			.setRequired(true)),
	new SlashCommandBuilder().setName('ping-remove').setDescription('Remove individual users from your ping list!').addStringOption(option =>
		option.setName('usernames')
			.setDescription('Users you would like to remove from your ping list. ONLY INCLUDE @\'s')
			.setRequired(true)),
	new SlashCommandBuilder().setName('ping-block').setDescription('Block a user from pinging you.').addStringOption(option =>
		option.setName('usernames')
			.setDescription('Include @Users or @Roles')
			.setRequired(true)),
	new SlashCommandBuilder().setName('ping-unblock').setDescription('Block a user from pinging you.').addStringOption(option =>
		option.setName('usernames')
			.setDescription('Include @Users or @Roles')
			.setRequired(true))
].map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(
	Routes.applicationCommands(clientId),
	{ body: commands },
);

module.exports = commands;