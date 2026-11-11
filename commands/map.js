const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const TYPE_EMOJIS = {
  Normal: "<:Normal:1570116937336361042>",
  Fighting: "<:Fighting:1570116778728882276>",
  Flying: "<:Flying:1570116824517836831>",
  Poison: "<:Poison:1570116957859094669>",
  Ground: "<:Ground:1570116896911663294>",
  Rock: "<:Rock:1570116995549237318>",
  Bug: "<:Bug:1570116658540970125>",
  Ghost: "<:Ghost:1570116844726132746>",
  Steel: "<:Steel:1570117016629805107>",
  Fire: "<:Fire:1570116803789594697>",
  Water: "<:Water:1570117040939995136>",
  Grass: "<:Grass:1570116868814143528>",
  Electric: "<:Electric:1570116736739713054>",
  Psychic: "<:Psychic:1570116976670544032>",
  Ice: "<:Ice:1570116915869913202>",
  Dragon: "<:Dragon:1570116710021861387>",
  Dark: "<:Dark:1570116686856593448>",
  Fairy: "<:Fairy:1570116757849640990>"
};

const GENERATION_MAPS = {
  "Gen 1": {
    "viridian-forest": { name: "Viridian Forest", types: ["Bug", "Grass", "Normal", "Flying"], recommended: ["Fire", "Flying", "Rock", "Ice"], avoid: ["Ground", "Water", "Grass"], description: "Lush woodland filled with swarming bug and grass types, often backed by poison sub-types." },
    "rocky-desert": { name: "Rocky Desert", types: ["Ground", "Rock", "Fighting"], recommended: ["Water", "Grass", "Ice", "Psychic"], avoid: ["Electric", "Rock", "Fire"], description: "Scorching sand, rock cannons and blinding storms." },
    "storm-coast": { name: "Storm Coast", types: ["Water", "Electric", "Flying"], recommended: ["Ground", "Grass", "Electric", "Rock"], avoid: ["Water", "Flying", "Steel"], description: "Beaches, reefs and electrical storms over the sea. Watch out for the tide." },
    "celestial-glacier": { name: "Celestial Glacier", types: ["Ice", "Water", "Psychic"], recommended: ["Fire", "Fighting", "Bug", "Dark", "Ghost"], avoid: ["Ice", "Water", "Psychic", "Dragon"], description: "Eternal ice beneath auroras. Frozen lakes are slippery and the cold freezes even attacks." },
    "cinnabar-island": { name: "Cinnabar Island", types: ["Fire", "Poison", "Rock"], recommended: ["Water", "Ground", "Psychic"], avoid: ["Fire", "Grass", "Bug", "Fairy", "Poison"], description: "A smoking volcano in the middle of the sea, rivers of lava and hot springs. Something terrible was born on this island." },
    "cerulean-cave": { name: "Cerulean Cave", types: ["Psychic", "Rock", "Ground"], recommended: ["Water", "Grass", "Ice", "Bug", "Ghost", "Dark"], avoid: ["Psychic", "Poison", "Electric"], description: "A crystal cavern beneath Cerulean City. The strongest Pokémon in Kanto live here... and something much worse." }
  },
  "Gen 2": {
    "ilex-forest": { name: "Ilex Forest", types: ["Bug", "Fairy", "Psychic"], recommended: ["Steel", "Poison", "Fire", "Flying", "Ghost", "Dark"], avoid: ["Fighting", "Dragon", "Psychic"], description: "Millenary trees and a wooden shrine. They say time doesn't always flow in the same direction here." },
    "ecruteak-city": { name: "Ecruteak City", types: ["Ghost", "Fire", "Normal"], recommended: ["Dark", "Water", "Ground", "Rock", "Fighting"], avoid: ["Ghost", "Psychic", "Normal", "Grass", "Bug", "Steel", "Ice"], description: "Red maples, the ruined Burned Tower and, on the horizon, the Tin Tower. Legendary beasts roam here." }
  }
};

function buildMapEmbedAndComponents(selectedGen = "Gen 1", selectedMapKey = "viridian-forest") {
  const genData = GENERATION_MAPS[selectedGen] || GENERATION_MAPS["Gen 1"];
  const mapData = genData[selectedMapKey] || Object.values(genData)[0];

  const typePills = mapData.types.map(t => `${TYPE_EMOJIS[t] || ''} **${t}**`).join('   ');
  const recommendedPills = mapData.recommended.map(t => `${TYPE_EMOJIS[t] || ''} **${t}**`).join('   ');
  const avoidPills = mapData.avoid.map(t => `${TYPE_EMOJIS[t] || ''} **${t}**`).join('   ');

  const embed = new EmbedBuilder()
    .setColor(0x3498DB)
    .setTitle(`🗺️ Area Scout [${selectedGen}] — ${mapData.name}`)
    .setDescription(mapData.description)
    .addFields(
      { name: '🛡️ DOMINANT TYPES', value: typePills, inline: false },
      { name: '⚔️ RECOMMENDED ELEMENTS (Bring These)', value: recommendedPills, inline: false },
      { name: '⚠️ ELEMENTS TO AVOID', value: avoidPills, inline: false }
    )
    .setFooter({ text: 'Pokebonk Tactical Mapping • Regional Scout' });

  const genMenu = new StringSelectMenuBuilder()
    .setCustomId('select_map_gen')
    .setPlaceholder('Select Generation')
    .addOptions(Object.keys(GENERATION_MAPS).map(gen => ({ label: gen, value: gen, default: gen === selectedGen })));

  const mapMenu = new StringSelectMenuBuilder()
    .setCustomId('select_map_location')
    .setPlaceholder('Select Map Location')
    .addOptions(Object.entries(genData).map(([key, data]) => ({ label: data.name, value: key, default: key === selectedMapKey })));

  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(genMenu), new ActionRowBuilder().addComponents(mapMenu)] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('map')
    .setDescription('View tactical type recommendations by generation and map.')
    .addStringOption(option => option.setName('generation').setDescription('Select game generation').setRequired(false).addChoices({ name: 'Gen 1', value: 'Gen 1' }, { name: 'Gen 2', value: 'Gen 2' }))
    .addStringOption(option => option.setName('location').setDescription('Select map location').setRequired(false)),

  async execute(interaction) {
    const gen = interaction.options.getString('generation') || 'Gen 1';
    const location = interaction.options.getString('location') || 'viridian-forest';
    await interaction.reply(buildMapEmbedAndComponents(gen, location));
  },

  buildMapEmbedAndComponents
};