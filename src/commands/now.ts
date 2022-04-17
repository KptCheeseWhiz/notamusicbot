import { APIApplicationCommandOption } from "discord-api-types/v10";

import { Player } from "../player";
import { ICommand } from "../icommand";
import { IAdapter } from "../adapters";
import { MessageEmbed } from "discord.js";

export class NowCommand implements ICommand {
  readonly name: string = "now";
  readonly description: string = "Displays the current track";
  readonly options: APIApplicationCommandOption[] = [];
  readonly default_permission: boolean = true;

  async execute(source: IAdapter, player: Player) {
    const queue = await player.resolveWithChannel(source, false);
    if (queue.tracks.length === 0 && !queue.playing)
      throw new Error("There are no tracks currently playing");

    const track = queue.playing;
    await source.reply({
      content: `Currently playing **${track.title}**`,
      embeds: [
        new MessageEmbed()
          .setTitle(track.title || "")
          .setDescription(track.description || "")
          .setThumbnail(track.thumbnail.url || "")
          .setURL(track.url || ""),
      ],
    });
  }
}

export default new NowCommand();
