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
  Fairy: "<:Fairy:1570116757849640990>",
  None: "❌"
};

// Type Color Palette (HEX code numbers)
const TYPE_COLORS = {
  Normal: 0x9FA19F,
  Fighting: 0xFF8000,
  Flying: 0x81B9EF,
  Poison: 0x9141CB,
  Ground: 0x915121,
  Rock: 0xafa981,
  Bug: 0x91A119,
  Ghost: 0x704170,
  Steel: 0x60A1B8,
  Fire: 0xE62829,
  Water: 0x2980EF,
  Grass: 0x3FA129,
  Electric: 0xFAC000,
  Psychic: 0xEF4179,
  Ice: 0x3FD8FF,
  Dragon: 0x5060E1,
  Dark: 0x50413F,
  Fairy: 0xEF70EF,
  None: 0x3498DB
};

const BASE_MATRIX = {
  Normal:   { Rock:0.8, Ghost:0.5, Steel:0.8 },
  Fighting: { Normal:1.35, Flying:0.8, Poison:0.8, Rock:1.35, Bug:0.8, Ghost:0.5, Psychic:0.8, Ice:1.35, Dark:1.35, Fairy:0.8 },
  Flying:   { Fighting:1.35, Rock:0.8, Bug:1.35, Steel:0.8, Grass:1.35, Electric:0.8 },
  Poison:   { Poison:0.8, Ground:0.8, Rock:0.8, Ghost:0.8, Steel:0.5, Grass:1.35, Fairy:1.35 },
  Ground:   { Flying:0.5, Poison:1.35, Rock:1.35, Bug:0.8, Steel:1.35, Fire:1.35, Grass:0.8, Electric:1.35 },
  Rock:     { Fighting:0.8, Ground:0.8, Flying:1.35, Bug:1.35, Steel:0.8, Fire:1.35, Ice:1.35 },
  Bug:      { Fighting:0.8, Flying:0.8, Poison:0.8, Ghost:0.8, Steel:0.8, Fire:0.8, Grass:1.35, Psychic:1.35, Dark:1.35, Fairy:0.8 },
  Ghost:    { Normal:0.5, Ghost:1.35, Psychic:1.35, Dark:0.8 },
  Steel:    { Rock:1.35, Steel:0.8, Fire:0.8, Water:0.8, Electric:0.8, Ice:1.35, Fairy:1.35 },
  Fire:     { Rock:0.8, Bug:1.35, Steel:1.35, Fire:0.8, Water:0.8, Grass:1.35, Ice:1.35, Dragon:0.8 },
  Water:    { Ground:1.35, Rock:1.35, Fire:1.35, Water:0.8, Grass:0.8, Dragon:0.8 },
  Grass:    { Flying:0.8, Poison:0.8, Ground:1.35, Rock:1.35, Bug:0.8, Steel:0.8, Fire:0.8, Water:1.35, Grass:0.8, Dragon:0.8 },
  Electric: { Flying:1.35, Ground:0.5, Water:1.35, Grass:0.8, Electric:0.8, Dragon:0.8 },
  Psychic:  { Fighting:1.35, Poison:1.35, Steel:0.8, Psychic:0.8, Dark:0.5 },
  Ice:      { Flying:1.35, Ground:1.35, Steel:0.8, Fire:0.8, Water:0.8, Grass:1.35, Ice:0.8, Dragon:1.35 },
  Dragon:   { Steel:0.8, Dragon:1.35, Fairy:0.5 },
  Dark:     { Fighting:0.8, Ghost:1.35, Psychic:1.35, Dark:0.8, Fairy:0.8 },
  Fairy:    { Fighting:1.35, Poison:0.8, Steel:0.8, Fire:0.8, Dragon:1.35, Dark:1.35 }
};

function calculateMatchups(type1, type2) {
  const multipliers = {};
  const allTypes = Object.keys(BASE_MATRIX);

  allTypes.forEach(attacker => {
    let mult = 1.0;
    if (BASE_MATRIX[attacker][type1] !== undefined) mult *= BASE_MATRIX[attacker][type1];
    if (type2 !== 'None' && BASE_MATRIX[attacker][type2] !== undefined) mult *= BASE_MATRIX[attacker][type2];
    mult = Math.max(0.40, Math.min(1.80, Number(mult.toFixed(2))));
    if (mult !== 1.0) multipliers[attacker] = mult;
  });

  const weakTo = [];
  const resists = [];
  for (const [t, m] of Object.entries(multipliers)) {
    if (m > 1.0) weakTo.push({ type: t, mult: m });
    if (m < 1.0) resists.push({ type: t, mult: m });
  }
  return { weakTo, resists };
}

function calculateOffense(type1, type2) {
  const strongMap = {};
  const addEffectiveForType = (t) => {
    if (!BASE_MATRIX[t]) return;
    for (const [defender, mult] of Object.entries(BASE_MATRIX[t])) {
      if (mult === 1.35) {
        if (!strongMap[defender] || mult > strongMap[defender]) {
          strongMap[defender] = mult;
        }
      }
    }
  };

  addEffectiveForType(type1);
  if (type2 !== 'None') addEffectiveForType(type2);

  return Object.entries(strongMap).map(([type, mult]) => ({
    type,
    mult: Number(mult.toFixed(2))
  }));
}

function buildEmbedAndComponents(type1 = 'Grass', type2 = 'None') {
  const { weakTo, resists } = calculateMatchups(type1, type2);
  const strongAgainst = calculateOffense(type1, type2);

  const weakStr = weakTo.length > 0 ? weakTo.map(w => `${TYPE_EMOJIS[w.type]} \`x${w.mult.toFixed(2)}\``).join('   ') : '`None`';
  const resistStr = resists.length > 0 ? resists.map(r => `${TYPE_EMOJIS[r.type]} \`x${r.mult.toFixed(2)}\``).join('   ') : '`None`';
  const strongStr = strongAgainst.length > 0 ? strongAgainst.map(s => `${TYPE_EMOJIS[s.type]} \`x${s.mult.toFixed(2)}\``).join('   ') : '`None`';
  
  const titleTypes = type2 !== 'None' ? `${TYPE_EMOJIS[type1]} ${type1} / ${TYPE_EMOJIS[type2]} ${type2}` : `${TYPE_EMOJIS[type1]} ${type1}`;

  // Use primary type's color for the embed border, fallback to secondary if primary is none
  const embedColor = TYPE_COLORS[type1] || TYPE_COLORS[type2] || 0x3498DB;

  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(`🛡️ Pokebonk Matchups — ${titleTypes}`)
    .addFields(
      { name: '🔻 WEAK TO', value: weakStr, inline: false },
      { name: '🛡️ RESISTS', value: resistStr, inline: false },
      { name: '⚔️ STRONG AGAINST', value: strongStr, inline: false }
    )
    .setFooter({ text: 'PokeBonk Rules • Clamped [x0.40 - x1.80]' });

  const primaryMenu = new StringSelectMenuBuilder()
    .setCustomId('select_type_1')
    .setPlaceholder('Select Primary Type')
    .addOptions(Object.keys(BASE_MATRIX).map(t => ({ label: t, value: t, default: t === type1 })));

  const secondaryMenu = new StringSelectMenuBuilder()
    .setCustomId('select_type_2')
    .setPlaceholder('Select Secondary Type')
    .addOptions([{ label: 'None', value: 'None', default: type2 === 'None' }, ...Object.keys(BASE_MATRIX).map(t => ({ label: t, value: t, default: t === type2 }))]);

  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(primaryMenu), new ActionRowBuilder().addComponents(secondaryMenu)] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('elements')
    .setDescription('Check element type weaknesses, resistances, and strengths interactively.')
    .addStringOption(option => option.setName('type1').setDescription('Select primary type').setRequired(false))
    .addStringOption(option => option.setName('type2').setDescription('Select secondary type').setRequired(false)),

  async execute(interaction) {
    const type1 = interaction.options.getString('type1') || 'Grass';
    const type2 = interaction.options.getString('type2') || 'None';
    await interaction.reply(buildEmbedAndComponents(type1, type2));
  },

  buildEmbedAndComponents
};