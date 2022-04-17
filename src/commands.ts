import { Client, Guild, ApplicationCommand } from "discord.js";
import {
  isArray as _isArray,
  isObject as _isObject,
  intersection as _intersection,
  isEqual as _isEqual,
  isEqualWith as _isEqualWith,
} from "lodash";
import { readdir } from "fs/promises";
import { join } from "path";

import { Player } from "./player";
import { ICommand } from "./icommand";
import { IAdapter } from "./adapters";

const commands: ICommand[] = [];
export const loadCommands = async () => {
  if (commands.length !== 0) return;
  const files = await readdir(join(__dirname, "commands"));
  let errors = 0;
  console.group("Loading commands..");
  for (const file of files) {
    if (!/\.(ts|js)$/.test(file)) continue;
    if (/\.d\.ts$/.test(file)) continue;

    try {
      const command: ICommand = (
        await import(join(__dirname, "commands", file))
      ).default;
      commands.push(command);
      console.log(`Found "${command.name}" -> ${command.description}`);
    } catch (e) {
      console.error(`Unable to load ${file}`);
      console.error(e);
      errors++;
    }
  }
  console.groupEnd();
  if (errors !== 0) throw new Error("Failed to load all commands");
};

const type_map = [
  ,
  "SUB_COMMAND",
  "SUB_COMMAND_GROUP",
  "STRING",
  "INTEGER",
  "BOOLEAN",
  "USER",
  "CHANNEL",
  "ROLE",
  "MENTIONABLE",
  "NUMBER",
];

// only compare properties that both objets have
function insersectionCompare(a: any, b: any): boolean {
  if (_isObject(a) && _isObject(b)) {
    if (_isArray(a) && _isArray(b) && a.length !== b.length) return false;
    const toCompare = _intersection(Object.keys(b), Object.keys(a));
    return toCompare.every((k) => {
      if (k === "type" && typeof a[k] === "number" && typeof b[k] === "string")
        return type_map[a[k]] === b[k];
      return insersectionCompare(a[k], b[k]);
    });
  } else if (_isObject(a) || _isObject(b)) return false;
  return _isEqual(a, b);
}

export const registerCommandToGuild = async (
  guild: Guild,
  force_update: boolean = false
): Promise<{ added: number; updated: number; removed: number }> => {
  console.group(`Registering slash commands for ${guild.name} <#${guild.id}>`);

  const guild_commands: (ApplicationCommand & { update?: boolean })[] = [
    ...(await guild.commands.fetch()).values(),
  ].filter((command) => command.applicationId === guild.applicationId);

  let removed = 0;
  for (
    let i = 0, command = guild_commands[i];
    i < guild_commands.length;
    command = guild_commands[++i]
  ) {
    const curr_command = commands.find((c) => c.name === command.name);
    if (!curr_command) {
      console.log(`Removing "${command.name}" ..`);
      await command.delete();
      removed++;
    } else
      guild_commands[i].update =
        force_update ||
        !_isEqualWith(curr_command, command, insersectionCompare);
  }

  let added = 0,
    updated = 0;
  for (const command of commands) {
    const guild_command = guild_commands.find(
      (c) => c && c.name === command.name
    );
    if (!guild_command) {
      console.log(`Adding "${command.name}" ..`);
      const ncommand = await guild.commands.create(command as any);
      if (!command.default_permission)
        await ncommand.permissions.set({
          permissions: await command.permissions(guild),
        });
      added++;
    } else if (guild_command.update) {
      console.log(`Updating "${command.name}" ..`);
      const ncommand = await guild.commands.edit(guild_command, command as any);
      if (!command.default_permission)
        await ncommand.permissions.set({
          permissions: await command.permissions(guild),
        });
      updated++;
    }
  }

  console.log(`+${added} ~${updated} -${removed}`);
  console.groupEnd();
  return {
    added,
    updated,
    removed,
  };
};

export const registerCommandToGuilds = async (client: Client) => {
  for (const [_, guild] of client.guilds.cache) {
    guild.applicationId = client.user.id;
    await registerCommandToGuild(guild);
  }
};

export const findCommand = (name: string) => {
  return commands.find((c) => c.name === name);
};

export const executeCommand = async (source: IAdapter, player: Player) => {
  const command = commands.find((c) => c.name === source.commandName);
  if (!command) return await source.reply("Command not found :(");
  return await command.execute(source, player);
};
