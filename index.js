const { Client, Collection, Partials, GatewayIntentBits, Events, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, PermissionsBitField, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js')
const fs = require('fs')
const colors = require('colors')
const mongourl = process.env['mongoURL']
const mongoose = require("mongoose")
require('./server')

const { messageLogs } = require('./events/messageLogs')
const { serverLogs } = require('./events/serverLogs')
const { memberLogs } = require('./events/memberLogs')



const client = new Client({
  intents:
    [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.DirectMessageReactions,
      GatewayIntentBits.DirectMessageTyping,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.DirectMessageReactions,
      GatewayIntentBits.GuildInvites
    ],
  partials: [
    Partials.Channel,
    Partials.Reaction,
    Partials.Message
  ]
});


const token = process.env['token']


client.commands = new Collection();
client.cooldowns = new Collection();
client.pcommands = new Collection();
client.aliases = new Collection();

const functions = fs.readdirSync("./functions").filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync("./events").filter(file => file.endsWith(".js"));
const commandFolders = fs.readdirSync("./commands");
const prefixFolders = fs.readdirSync("./prefixCommands");

(async () => {
  for (file of functions) {
    require(`./functions/${file}`)(client);
  }

  (async () => {
    for (file of functions) {
      require(`./functions/${file}`)(client);
    }

    try {
      mongoose.connect(mongourl, {
        keepAlive: true
      })

      console.log(colors.cyan('[MONGO] - Connected to MongoDB!'))
    } catch (err) {
      console.log(err)
    }
  })()
})()

client.events(eventFiles, "./events")
client.Commands(commandFolders, "./commands")
client.PrefixC(prefixFolders, "./prefixCommands")


const cmdschema = require('./models/cmdcount')
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction) return;
  if (!interaction.isChatInputCommand()) {
    return
  } else {
    const data = await cmdschema.findOne({
      Command: interaction.commandName
    });

    if (data) {
      data.Count ++
      data.save()
    } else if (!data || data.Count === 0) {
      await cmdschema.create({
        Command: interaction.commandName,
        Count: 1
      })
    }
  }
})

const welcomeschema = require('./models/welcome')
client.on(Events.GuildMemberAdd, async (member) => {
  const data = await welcomeschema.findOne({
    Guild: member.guild.id
  })

  if (!data) return;
  else {
    const channel = member.guild.channels.cache.get(data.Channel)
    const msg = data.Message

    const embed = new EmbedBuilder()
    .setTitle(`Welcome, ${member.user.username}!`)
    .setDescription(`${msg}`)
    .setThumbnail(member.displayAvatarURL())
    .setColor("White")

    await channel.send({ embeds: [emebed] }).catch((err) => {
      
    })
  }
})

client.login(token).then(() => {
  messageLogs(client)
  memberLogs(client)
  serverLogs(client)
})
