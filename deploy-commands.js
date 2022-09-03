const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const token = process.env.PINGBOTTOKEN;
const clientId = process.env.PingClient;

const commands = [
	new SlashCommandBuilder().setName('ping').setDescription('Pings users that you are in the call. PRESS ENTER FIRST.'),
	new SlashCommandBuilder().setName('ping-edit').setDescription('Edits collection of users')
	.addStringOption(option => 
		option.setName('add-users')
		.setDescription('Add/Change users to ping. Add @\'s')
		.setRequired(true)),
	new SlashCommandBuilder().setName('ping-help').setDescription('Know all the commands of the bot!'),
	new SlashCommandBuilder().setName('ping-message').setDescription('Update the message you want to send!'),



]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(
	Routes.applicationCommands(clientId),
	{ body: commands },
);