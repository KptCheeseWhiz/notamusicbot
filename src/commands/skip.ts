import { APIApplicationCommandOption } from "discord-api-types/v10";

import { Player } from "../player";
import { ICommand } from "../icommand";
import { IAdapter } from "../adapters";
import { MessageEmbed } from "discord.js";

export class SkipCommand implements ICommand {
  readonly name: string = "skip";
  readonly description: string = "Skips the current track";
  readonly options: APIApplicationCommandOption[] = [];
  readonly default_permission: boolean = true;

  async execute(source: IAdapter, player: Player) {
    const queue = await player.resolveWithChannel(source);

    if (queue.tracks.length === 0 && !queue.playing)
      throw new Error("There are no tracks to skip");

    const next = await queue.skip();
    if (!next) await source.reply("Skipped, no more tracks to play..");
    else
      await source.reply({
        content: `Skipped, now playing **${next.title}**`,
        embeds: [
          new MessageEmbed()
            .setTitle(next.title || "")
            .setDescription(next.description || "")
            .setThumbnail(next.thumbnail.url || "")
            .setURL(next.url || ""),
        ],
      });
  }
}

export default new SkipCommand();
