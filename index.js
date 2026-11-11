const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
require('dotenv').config();

// Initialize Express server for Render port-binding
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🤖 Pokebonk Bot is alive and running 24/7!');
});

app.listen(PORT, () => {
  console.log(`🌍 Web server is listening on port ${PORT}`);
});

// Initialize Discord Client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Load all command files dynamically
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  }
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Handle Interactions (Slash Commands & Dropdown Menus)
client.on('interactionCreate', async interaction => {
  // 1. Handle Slash Commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      const errorMessage = { content: 'There was an error executing this command!', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  } 
  // 2. Handle Dropdown Menu Selections (Select Menus)
  else if (interaction.isStringSelectMenu()) {
    try {
      await interaction.deferUpdate();
      const selectedValue = interaction.values[0];

      // Handle Elements Command Dropdowns
      if (interaction.customId === 'select_type_1' || interaction.customId === 'select_type_2') {
        let type1 = 'Grass';
        let type2 = 'None';

        // Extract current defaults or selections from message components
        interaction.message.components.forEach(row => {
          row.components.forEach(comp => {
            if (comp.customId === 'select_type_1') {
              const active = comp.options.find(o => o.default) || comp.options[0];
              type1 = active.value;
            }
            if (comp.customId === 'select_type_2') {
              const active = comp.options.find(o => o.default) || comp.options[0];
              type2 = active.value;
            }
          });
        });

        // Override with what the user just clicked
        if (interaction.customId === 'select_type_1') type1 = selectedValue;
        if (interaction.customId === 'select_type_2') type2 = selectedValue;

        // Re-import elements command builder helper or execute update
        const elementsCmd = require('./commands/elements.js');
        if (typeof elementsCmd.buildEmbedAndComponents === 'function') {
          const payload = elementsCmd.buildEmbedAndComponents(type1, type2);
          await interaction.editReply(payload);
        }
      }
      
      // Handle Map Command Dropdowns
      else if (interaction.customId === 'select_map_gen' || interaction.customId === 'select_map_location') {
        let currentGen = 'Gen 1';
        let currentLocation = 'viridian-forest';

        // Extract current defaults or selections from map message components
        interaction.message.components.forEach(row => {
          row.components.forEach(comp => {
            if (comp.customId === 'select_map_gen') {
              const active = comp.options.find(o => o.default) || comp.options[0];
              currentGen = active.value;
            }
            if (comp.customId === 'select_map_location') {
              const active = comp.options.find(o => o.default) || comp.options[0];
              currentLocation = active.value;
            }
          });
        });

        // Override with what the user just clicked
        if (interaction.customId === 'select_map_gen') {
          currentGen = selectedValue;
          // Reset location default to the first available map of the newly selected generation
          if (currentGen === 'Gen 2') currentLocation = 'ilex-forest';
          else currentLocation = 'viridian-forest';
        }
        if (interaction.customId === 'select_map_location') {
          currentLocation = selectedValue;
        }

        const mapCmd = require('./commands/map.js');
        if (typeof mapCmd.buildMapEmbedAndComponents === 'function') {
          const payload = mapCmd.buildMapEmbedAndComponents(currentGen, currentLocation);
          await interaction.editReply(payload);
        }
      }
    } catch (error) {
      console.error('Error handling select menu:', error);
    }
  }
});

// Log into Discord using your environment variable
client.login(process.env.DISCORD_TOKEN);