const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // Array of your 2 target server IDs from your .env file
    const targetGuildIds = [
      process.env.GUILD_ID_1,
      process.env.GUILD_ID_2
    ];

    // Loop through both servers and register the commands instantly to each
    for (const guildId of targetGuildIds) {
      if (!guildId) continue;
      
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
        { body: commands },
      );
      
      console.log(`Successfully registered commands to server ID: ${guildId}`);
    }

    console.log('Successfully reloaded application (/) commands for all target servers.');
  } catch (error) {
    console.error(error);
  }
})();