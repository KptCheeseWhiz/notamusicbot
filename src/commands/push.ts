import { APIApplicationCommandOption } from "discord-api-types/v10";
import { MessageEmbed } from "discord.js";

import { Player } from "../player";
import { ICommand } from "../icommand";
import { IAdapter } from "../adapters";

export class PushCommand implements ICommand {
  readonly name: string = "push";
  readonly description: string = "Adds a track to the end of the playlist";
  readonly options: APIApplicationCommandOption[] = [
    {
      name: "query",
      description: "The query to search a track",
      type: 3,
      required: true,
    },
  ];
  readonly default_permission: boolean = true;

  async execute(source: IAdapter, player: Player) {
    const track = (
      await player.search(source.getArgument<string>("query", true), {
        requestedBy: source.user,
      })
    );

    if (!track) throw new Error("No results found");

    const queue = await player.resolveWithChannel(source);
    await queue.push(track);

    await source.reply({
      content: `Added **${track.title}** to the playlist!`,
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

export default new PushCommand();
