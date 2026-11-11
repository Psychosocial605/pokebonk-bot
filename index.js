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
      // Handle Elements Command Dropdowns
      if (interaction.customId === 'select_type_1' || interaction.customId === 'select_type_2') {
        await interaction.deferUpdate();
        
        // Grab the current components/embed or parse state from the message
        // For simplicity, we can re-evaluate based on the menus or store state. 
        // Alternatively, you can grab selected values from the row components:
        const row1 = interaction.message.components[0];
        const row2 = interaction.message.components[1];

        // Find selected values or fallback
        let type1 = 'Grass';
        let type2 = 'None';

        // Read active selections from the menus
        interaction.message.components.forEach(row => {
          row.components.forEach(comp => {
            if (comp.customId === 'select_type_1') {
              const selectedOpt = comp.options.find(o => o.default) || comp.options[0];
              // If user just changed it, check values
              if (interaction.customId === 'select_type_1') {
                type1 = interaction.values[0];
              } else {
                const defOpt = comp.options.find(o => o.default);
                if (defOpt) type1 = defOpt.value;
              }
            }
            if (comp.customId === 'select_type_2') {
              if (interaction.customId === 'select_type_2') {
                type2 = interaction.values[0];
              } else {
                const defOpt = comp.options.find(o => o.default);
                if (defOpt) type2 = defOpt.value;
              }
            }
          });
        });

        // Re-import or call your build logic if shared, or update message directly.
        // Quickest way: fetch the elements command file and run a helper or update response.
        const elementsCommand = client.commands.get('elements');
        // (Assuming you modularize or handle it here)
      }
      
      // Handle Map Command Dropdowns
      else if (interaction.customId === 'select_map_gen' || interaction.customId === 'select_map_location') {
        await interaction.deferUpdate();
        // Map updates can be handled similarly by reading the selected values
      }
    } catch (error) {
      console.error('Error handling select menu:', error);
    }
  }
});

// Log into Discord using your environment variable
client.login(process.env.DISCORD_TOKEN);