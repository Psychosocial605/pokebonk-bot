const { SlashCommandBuilder, REST, Routes, PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deploy-commands')
    .setDescription('Refreshes and re-registers all bot slash commands dynamically.')
    // Optional: Restrict this command so only Admins/Server Managers can run it
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const commands = [];
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
      }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
      // If you are using guild-specific commands for instant updates during development:
      await rest.put(
        Routes.applicationGuildCommands(interaction.client.user.id, interaction.guildId),
        { body: commands },
      );

      // (Uncomment below if you want global deployment instead, though global can take up to an hour to propagate)
      /*
      await rest.put(
        Routes.applicationCommands(interaction.client.user.id),
        { body: commands },
      );
      */

      await interaction.editReply(`✅ Successfully re-registered **${commands.length}** commands without restarting the bot!`);
    } catch (error) {
      console.error(error);
      await interaction.editReply('❌ There was an error trying to deploy commands.');
    }
  },
};