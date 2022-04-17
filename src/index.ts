import dotenv from "dotenv";
dotenv.config();

const DISCORD_TOKEN: string | undefined = process.env.DISCORD_TOKEN;
if (!DISCORD_TOKEN) {
  console.error("missing discord token");
  process.exit(1);
}

const COMMAND_PREFIX = (process.env.COMMAND_PREFIX || "%")[0];

import {
  CacheType,
  Client,
  CommandInteraction,
  Intents,
  Message,
} from "discord.js";

import { Player } from "./player";
import { IAdapter, InteractionAdapter, MessageAdapter } from "./adapters";
import {
  loadCommands,
  registerCommandToGuild,
  registerCommandToGuilds,
} from "./commands";

const client: Client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});

let player: Player;
client
  .on("warn", (e) => console.warn("Client warning", e))
  .on("error", (e) => console.error("Client error", e))
  .on("ready", async (client) => {
    console.log(`Ready as ${client.user.tag} <#${client.user.id}>`);
    client.user.setActivity(
      `Use the "${COMMAND_PREFIX}" prefix or the slash commands in a channel with my name to interact with me`
    );

    player = new Player(client);
    await registerCommandToGuilds(client);
  })

  .on("guildCreate", async (guild) => {
    console.log(`Added to new guild ${guild.name} <#${guild.id}>`);
    await registerCommandToGuild(guild);
  })

  .on("guildDelete", async (guild) => {
    console.log(`Removed from guild ${guild.name} <#${guild.id}>`);
    player.delete(guild);
  })

  .on("messageCreate", async (message: Message<boolean>) => {
    if (
      message.member.user.bot ||
      message.content.substring(0, COMMAND_PREFIX.length) !== COMMAND_PREFIX
    )
      return;
    await handleSource(new MessageAdapter(message, player));
  })

  .on(
    "interactionCreate",
    async (interaction: CommandInteraction<CacheType>) => {
      if (interaction.member.user.bot || !interaction.isCommand()) return;
      await handleSource(new InteractionAdapter(interaction, player));
    }
  );

const handleSource = async (source: IAdapter) => {
  if (!source.command) return;
  if (
    source.guild.channels.resolve(source.channelId).name !==
    client.user.username
  ) {
    await source.reply({
      content: "I only listen to commands in a channel that has my own name",
    });
    return;
  }

  console.log(
    `${source.guild.name} <#${source.guildId}> ${source.commandName}`,
    source.arguments
  );

  try {
    await source.execute();
  } catch (e) {
    console.log(e);
    await source.reply({
      content: e.message,
    });
  }
};

loadCommands().then(() => client.login(process.env.TOKEN));
