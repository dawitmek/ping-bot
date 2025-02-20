// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, WebhookClient } = require("discord.js");
const token = process.env.PINGBOTTOKEN;

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const lib = require("./external-functions.js");


// Create a new client instance Discord.js
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers
    ],
});

client.commands = new Collection();

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client.commands.set(command.data.name, command);
}

// When the client is ready, run this code (only once) Discord.js
client.once("ready", () => {
    console.log(new Date().toLocaleString() + " Ready from discord.js!");
    client.user.setActivity("Friends", {
        type: "WATCHING",
    });
});


client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    await interaction.deferReply({ ephemeral: true });

    const command = client.commands.get(interaction.commandName);

    if (!command) return;


    try {
        await lib.databaseConnect()
            .then(async () => await command.execute(interaction, client))
            .catch((err) => {
                if (interaction.deferred && !interaction.replied) {
                    if (err.name == "MongoNotConnectedError") {
                        interaction.editReply({
                            content: "Something went wrong with the database while processing your request.",
                            ephemeral: true,
                        })
                        console.error("Database connection error: ", err)

                    } else {
                        interaction.editReply({
                            content: "Something went wrong while processing your request.",
                            ephemeral: true,
                        })
                        console.error("Client error: ", err)
                    }
                }
            })
    } catch (err) {
        console.error("Error running interaction: ", err);
        //interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    } finally {
        await lib.closeDatabase();
    }
});


// Login to Discord with your client's token
client.login(token);
