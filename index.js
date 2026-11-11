const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🤖 Pokebonk Bot is alive and running 24/7!');
});

app.listen(PORT, () => {
  console.log(`🌍 Web server is listening on port ${PORT}`);
});

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

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

client.on('interactionCreate', async interaction => {
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
  else if (interaction.isStringSelectMenu()) {
    try {
      await interaction.deferUpdate();
      const selectedValue = interaction.values[0];

      // Elements Dropdowns
      if (interaction.customId === 'select_type_1' || interaction.customId === 'select_type_2') {
        let type1 = 'Grass';
        let type2 = 'None';

        // Read current selections from the message menus if available
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

        if (interaction.customId === 'select_type_1') type1 = selectedValue;
        if (interaction.customId === 'select_type_2') type2 = selectedValue;

        const elementsCmd = client.commands.get('elements');
        if (elementsCmd && typeof elementsCmd.buildEmbedAndComponents === 'function') {
          await interaction.editReply(elementsCmd.buildEmbedAndComponents(type1, type2));
        }
      }
      
      // Map Dropdowns
      else if (interaction.customId === 'select_map_gen' || interaction.customId === 'select_map_location') {
        let currentGen = 'Gen 1';
        let currentLocation = 'viridian-forest';

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

        if (interaction.customId === 'select_map_gen') {
          currentGen = selectedValue;
          currentLocation = currentGen === 'Gen 2' ? 'ilex-forest' : 'viridian-forest';
        } else if (interaction.customId === 'select_map_location') {
          currentLocation = selectedValue;
        }

        const mapCmd = client.commands.get('map');
        if (mapCmd && typeof mapCmd.buildMapEmbedAndComponents === 'function') {
          await interaction.editReply(mapCmd.buildMapEmbedAndComponents(currentGen, currentLocation));
        }
      }
    } catch (error) {
      console.error('Error handling select menu:', error);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);