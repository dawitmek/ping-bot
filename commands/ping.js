const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const lib = require('../external-functions.js'); // Ensure this has your rateLimiterOK logic

// Helper function for delaying execution (if your lib.rateLimiterOK needs it)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to fetch user with a timeout
async function fetchUserWithTimeout(client, userId, timeoutMs = 15000) { // 15-second timeout
    try {
        return await Promise.race([
            client.users.fetch(userId.toString()),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms fetching user ${userId}`)), timeoutMs)
            )
        ]);
    } catch (error) {
        // Error logged in the main loop where this function is called
        throw error; // Re-throw to be caught by the main loop's catch
    }
}

// Helper function to send the DM
async function sendPingDM(discordUser, interaction, senderUserData) {
    // Bot check is done prior to calling this function in this version
    try {
        // console.log(`[Ping] Attempting DM to ${discordUser.username} (${discordUser.id})`); // Verbose
        await discordUser.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xf1f1f1)
                    .setTitle(userData.message + "\n\nhttps://discord.com/channels/" + interaction.guildId + "/" + interaction.channelId)
                    .setAuthor({
                        name: interaction.user.globalName,
                        iconURL: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}`
                    })
                    .setDescription("Click link to head there!")
                    .setTimestamp()
                    .setFooter({ text: `Sent via Ping Bot` })

            ]
        });
        console.log(`[Ping] DM SUCCESS to ${discordUser.username} (${discordUser.id})`); // Verbose
        return { success: true, username: discordUser.username };
    } catch (err) {
        // Error logged in the main loop
        throw err; // Re-throw to be caught by the main loop's DM catch
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Sends a message to the users in your ping list.'),
    async execute(interaction, client) {
        const logPrefix = `[Ping Command by ${interaction.user.username} (${interaction.user.id})]`;
        console.log(`${logPrefix} Initiated in guild ${interaction.guildId}.`);

        try {
            const senderUserData = await lib.dbClient.db("Ping-Bot").collection(interaction.guildId).findOne({ id: interaction.user.id });
            if (!senderUserData || !senderUserData.message) {
                await interaction.editReply({ content: "You haven't set a ping message! Use `/ping-edit message <your_message>` to set one." });
                console.log(`${logPrefix} Terminated: No ping message set.`);
                return;
            }

            const usersToPingData = await lib.findUsers(interaction.guildId, interaction.user.id);
            let userIdsToPing = [];
            if (usersToPingData && usersToPingData.pingUsers) {
                userIdsToPing = Array.isArray(usersToPingData.pingUsers) ? usersToPingData.pingUsers : Object.keys(usersToPingData.pingUsers);
            }

            if (!userIdsToPing || userIdsToPing.length === 0) {
                await interaction.editReply({ content: "Your ping list is empty. Use `/ping-edit add @user` to add users." });
                console.log(`${logPrefix} Terminated: Ping list empty.`);
                return;
            }
            console.log(`${logPrefix} Processing ${userIdsToPing.length} users.`);

            const blockListsCursor = await lib.dbClient.db("Ping-Bot").collection("block_list").find({ id: { $in: userIdsToPing } });
            const blockListsArray = await blockListsCursor.toArray();
            const blockListMap = new Map(blockListsArray.map(list => [list.id, new Set(list.blockedUsers || [])]));
            console.log(`${logPrefix} Fetched ${blockListsArray.length} blocklist documents for ${userIdsToPing.length} target users.`);

            const dmResults = { successful: [], failed: [], skipped_blocked: [], skipped_bots: [], skipped_fetch_fail: [] };
            const totalUsersInList = userIdsToPing.length;

            for (let i = 0; i < userIdsToPing.length; i++) {
                const targetUserId = userIdsToPing[i];

                const userBlockSet = blockListMap.get(targetUserId);
                if (userBlockSet && userBlockSet.has(interaction.user.id)) {
                    console.log(`${logPrefix} SKIP (Blocked): Target ${targetUserId} has blocked sender.`);
                    dmResults.skipped_blocked.push(targetUserId);
                    continue;
                }

                let discordUser;
                try {
                    discordUser = await fetchUserWithTimeout(client, targetUserId, 15000); // 15s timeout for fetch

                    if (!discordUser) {
                        console.log(`${logPrefix} SKIP (Fetch Fail): Could not fetch/timed out for user ID ${targetUserId}.`);
                        dmResults.skipped_fetch_fail.push({ id: targetUserId, error: 'User not found or fetch timed out.' });
                        continue;
                    }

                    if (discordUser.bot) {
                        console.log(`${logPrefix} SKIP (Bot): User ${discordUser.username} (${targetUserId}) is a bot.`);
                        dmResults.skipped_bots.push(discordUser.username || targetUserId);
                        continue;
                    }

                    // Check rate limit using external function
                    if (lib.rateLimiterOK && !lib.rateLimiterOK(interaction.user.id)) {
                        console.log(`${logPrefix} RATE LIMIT (lib): Detected by lib.rateLimiterOK. Waiting 5 seconds before DM to ${discordUser.username} (${targetUserId}).`);
                        await sleep(5000); // Use the global or lib.sleep
                        if (!lib.rateLimiterOK(interaction.user.id)) { // Re-check
                            console.log(`${logPrefix} RATE LIMIT (lib): Still limited after wait for ${discordUser.username} (${targetUserId}). Skipping DM.`);
                            dmResults.failed.push({ username: discordUser.username, error: 'Rate limited by lib, skipped after wait.' });
                            continue;
                        }
                    }

                    try {
                        const result = await sendPingDM(discordUser, interaction, senderUserData);
                        // `sendPingDM` now only returns success/failure, specific errors logged within it or here if it throws
                        if (result.success && !result.skipped) { // skipped is true for bots, already handled
                            dmResults.successful.push(result.username);
                        }
                        // Failures where DM couldn't be sent are caught below
                    } catch (dmError) {
                        console.error(`${logPrefix} DM SEND ERROR to ${discordUser.username} (${discordUser.id}): ${dmError.message} (Code: ${dmError.code || 'N/A'})`);
                        dmResults.failed.push({ username: discordUser.username, error: dmError.message });
                    }

                } catch (fetchOrOuterLoopError) {
                    // This catches errors from fetchUserWithTimeout or other synchronous errors in the user processing try block
                    console.error(`${logPrefix} PROCESSING ERROR for user ID ${targetUserId}: ${fetchOrOuterLoopError.message}`);
                    // Ensure it's added to a relevant category if not already covered
                    if (!dmResults.skipped_fetch_fail.find(u => u.id === targetUserId)) {
                        dmResults.failed.push({ id: targetUserId, error: `Processing error: ${fetchOrOuterLoopError.message}` });
                    }
                }
            }

            // Build summary embed
            const summaryEmbed = new EmbedBuilder()
                .setTitle('Ping Attempt Summary')
                .setAuthor({ name: interaction.user.globalName || interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();
            summaryEmbed.setDescription(`Attempted to ping ${totalUsersInList} user(s) from your list.`);

            if (dmResults.successful.length > 0) summaryEmbed.addFields({ name: '✅ Successful Pings', value: `${dmResults.successful.length}`, inline: true });
            if (dmResults.failed.length > 0) summaryEmbed.addFields({ name: '❌ Failed Pings/Errors', value: `${dmResults.failed.length + dmResults.skipped_fetch_fail.length}`, inline: true });
            if (dmResults.skipped_blocked.length > 0) summaryEmbed.addFields({ name: '🚫 Skipped (User Blocked You)', value: `${dmResults.skipped_blocked.length}`, inline: true });
            if (dmResults.skipped_bots.length > 0) summaryEmbed.addFields({ name: '🤖 Skipped (Bot Accounts)', value: `${dmResults.skipped_bots.length}`, inline: true });

            const totalProcessedOrSkipped = dmResults.successful.length + dmResults.failed.length + dmResults.skipped_fetch_fail.length + dmResults.skipped_blocked.length + dmResults.skipped_bots.length;

            if (dmResults.successful.length === totalUsersInList && totalUsersInList > 0 && dmResults.failed.length === 0 && dmResults.skipped_blocked.length === 0 && dmResults.skipped_fetch_fail.length === 0) {
                summaryEmbed.setColor(0x57F287); // Green
            } else if (dmResults.successful.length > 0) {
                summaryEmbed.setColor(0xFEA62E); // Orange
            } else if (totalUsersInList > 0 && (dmResults.failed.length > 0 || dmResults.skipped_blocked.length > 0 || dmResults.skipped_fetch_fail.length > 0)) {
                summaryEmbed.setColor(0xED4245); // Red
            } else if (totalUsersInList > 0 && dmResults.skipped_bots.length === totalUsersInList) {
                summaryEmbed.setColor(0x5865F2); // Neutral Blue
            } else {
                summaryEmbed.setColor(0x5865F2); // Neutral Blue
            }
            if (dmResults.failed.length > 0 || dmResults.skipped_fetch_fail.length > 0) summaryEmbed.setFooter({ text: "Failures can be due to DMs disabled, bot blocked, or user fetch issues." });

            if (totalUsersInList > 0 && totalProcessedOrSkipped === 0 && dmResults.successful.length === 0) {
                // This case means users were in the list but none of the categories above were hit, which is unlikely
                summaryEmbed.setDescription(`Attempted to ping ${totalUsersInList} user(s), but no specific outcomes were recorded (this indicates an unusual state).`);
                summaryEmbed.setColor(0xED4245); summaryEmbed.setFields([]);
            }


            await interaction.editReply({ embeds: [summaryEmbed], content: "" });
            console.log(`${logPrefix} Completed. Success: ${dmResults.successful.length}, Failed/FetchFail: ${dmResults.failed.length + dmResults.skipped_fetch_fail.length}, Skipped Blocked: ${dmResults.skipped_blocked.length}, Skipped Bots: ${dmResults.skipped_bots.length}.`);

        } catch (error) {
            console.error(`${logPrefix} CRITICAL ERROR: `, error);
            try {
                await interaction.editReply({
                    content: `An unexpected error occurred: ${error.message.substring(0, 1800)}`, // Limit error message length for reply
                    embeds: []
                });
            } catch (editError) {
                console.error(`${logPrefix} CRITICAL ERROR: Failed to editReply with error message:`, editError);
            }
        }
    }
};