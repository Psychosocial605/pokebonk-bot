require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  SlashCommandBuilder, 
  REST, 
  Routes, 
  ActivityType 
} = require('discord.js');

// 1. Data Structures & Multipliers
const TYPES = [
  "Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost",
  "Steel", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark", "Fairy"
];

// Your custom server emoji mappings
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

function getBaseMultiplier(atk, def) {
  return BASE_MATRIX[atk]?.[def] ?? 1.0;
}

function clampMultiplier(val) {
  return Math.min(1.80, Math.max(0.40, val));
}

// 2. Helper to Build Embed and Menus
function buildEmbedAndComponents(primaryType = "Grass", secondaryType = "None") {
  const titleStr = (secondaryType === "None" || secondaryType === primaryType)
    ? `${TYPE_EMOJIS[primaryType]} ${primaryType}`
    : `${TYPE_EMOJIS[primaryType]} ${primaryType} / ${TYPE_EMOJIS[secondaryType]} ${secondaryType}`;

  const weakItems = [];
  const resistItems = [];
  const strongItems = [];

  TYPES.forEach(atk => {
    const m1 = getBaseMultiplier(atk, primaryType);
    const m2 = (secondaryType !== "None" && secondaryType !== primaryType) ? getBaseMultiplier(atk, secondaryType) : 1.0;
    const finalMult = clampMultiplier(m1 * m2);
    const emoji = TYPE_EMOJIS[atk] || "";

    if (finalMult > 1.0) weakItems.push(`${emoji} \`x${finalMult.toFixed(2)}\``);
    else if (finalMult < 1.0) resistItems.push(`${emoji} \`x${finalMult.toFixed(2)}\``);
  });

  TYPES.forEach(def => {
    const m1 = getBaseMultiplier(primaryType, def);
    const m2 = (secondaryType !== "None" && secondaryType !== primaryType) ? getBaseMultiplier(secondaryType, def) : 1.0;
    const finalMult = (secondaryType !== "None" && secondaryType !== primaryType) ? Math.max(m1, m2) : m1;
    const emoji = TYPE_EMOJIS[def] || "";

    if (finalMult > 1.0) strongItems.push(`${emoji} \`x${finalMult.toFixed(2)}\``);
  });

  const embed = new EmbedBuilder()
    .setTitle(`🛡️ Pokebonk Matchups — ${titleStr}`)
    .setColor(0x181D2A)
    .addFields(
      { name: `🔻 WEAK TO (${weakItems.length} types)`, value: weakItems.join('   ') || '*None*', inline: false },
      { name: `🛡️ RESISTS (${resistItems.length} types)`, value: resistItems.join('   ') || '*None*', inline: false },
      { name: `⚔️ STRONG AGAINST (${strongItems.length} types)`, value: strongItems.join('   ') || '*None*', inline: false }
    )
    .setFooter({ text: 'PokeBonk Rules • Clamped [x0.40 - x1.80]' });

  const primaryMenu = new StringSelectMenuBuilder()
    .setCustomId(`select_primary:${primaryType}:${secondaryType}`)
    .setPlaceholder('Select Primary Type...')
    .addOptions(TYPES.map(t => ({ label: t, value: t, emoji: TYPE_EMOJIS[t], default: t === primaryType })));

  const secondaryMenu = new StringSelectMenuBuilder()
    .setCustomId(`select_secondary:${primaryType}:${secondaryType}`)
    .setPlaceholder('Select Secondary Type (Optional)...')
    .addOptions([
      { label: 'None', value: 'None', emoji: '❌', default: secondaryType === 'None' },
      ...TYPES.map(t => ({ label: t, value: t, emoji: TYPE_EMOJIS[t], default: t === secondaryType }))
    ]);

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(primaryMenu),
      new ActionRowBuilder().addComponents(secondaryMenu)
    ]
  };
}

// 3. Client Setup
const client = new Client({ 
  intents: [GatewayIntentBits.Guilds] 
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: 'Pokebonk with friends', type: ActivityType.Playing }],
    status: 'online',
  });
});

// 4. Handle Slash Command & Dropdowns
client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'pokebonk') {
      const type1 = interaction.options.getString('type1') || 'Grass';
      const type2 = interaction.options.getString('type2') || 'None';
      const payload = buildEmbedAndComponents(type1, type2);
      await interaction.reply(payload);
    }
  }

  if (interaction.isStringSelectMenu()) {
    const [action, curT1, curT2] = interaction.customId.split(':');
    const selectedVal = interaction.values[0];

    let newT1 = curT1;
    let newT2 = curT2;

    if (action === 'select_primary') newT1 = selectedVal;
    if (action === 'select_secondary') newT2 = selectedVal;

    const payload = buildEmbedAndComponents(newT1, newT2);
    await interaction.update(payload);
  }
});

// 5. Register Slash Command with Discord
const commands = [
  new SlashCommandBuilder()
    .setName('pokebonk')
    .setDescription('Check Pokebonk type weaknesses and strengths interactively.')
].map(cmd => cmd.toJSON());

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Slash commands registered successfully!');
  } catch (err) {
    console.error('Error registering commands:', err);
  }
}

registerCommands();
client.login(process.env.DISCORD_TOKEN);