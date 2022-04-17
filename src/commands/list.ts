import { APIApplicationCommandOption } from "discord-api-types/v10";
import { MessageButton, MessageActionRow } from "discord.js";

import { Player } from "../player";
import { ICommand } from "../icommand";
import { IAdapter } from "../adapters";
import { componentCollectorFilter, formatMilliseconds } from "../util";

const MAX_PER_PAGE = +(process.env.MAX_PER_PAGE || 10);
const COLLECTOR_TIME_LIMIT = Math.min(
  +(process.env.COLLECTOR_TIME_LIMIT || 900000),
  900000
);

export class ListCommand implements ICommand {
  readonly name: string = "list";
  readonly description: string = "Shows the current playlist";
  readonly options: APIApplicationCommandOption[] = [];
  readonly default_permission: boolean = true;

  async execute(source: IAdapter, player: Player) {
    const queue = await player.resolveWithChannel(source, false);
    if (queue.tracks.length === 0) {
      await source.reply("```\n(no tracks yet)```");
      return;
    }

    const max_page = Math.ceil(queue.tracks.length / MAX_PER_PAGE) - 1;
    const current = queue.playing;
    const current_index = queue.tracks.findIndex((t) => t.id === current.id);
    let page =
      current_index === -1 ? 0 : Math.ceil(current_index / MAX_PER_PAGE);

    const action_row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("top")
        .setLabel("⏫")
        .setStyle("PRIMARY")
        .setDisabled(page === 0),
      new MessageButton()
        .setCustomId("up")
        .setLabel("⬆️")
        .setStyle("PRIMARY")
        .setDisabled(page === 0),
      new MessageButton()
        .setCustomId("down")
        .setLabel("⬇️")
        .setStyle("PRIMARY")
        .setDisabled(page === max_page),
      new MessageButton()
        .setCustomId("bottom")
        .setLabel("⏬")
        .setStyle("PRIMARY")
        .setDisabled(page === max_page)
    );

    source.channel
      .createMessageComponentCollector({
        filter: componentCollectorFilter.bind(null, source),
        time: COLLECTOR_TIME_LIMIT,
      })
      .on("collect", async (message) => {
        const max_page = Math.ceil(queue.tracks.length / MAX_PER_PAGE) - 1;
        let new_page = 0;

        switch (message.customId) {
          case "up":
            new_page = Math.max(page - 1, 0);
            if (page === new_page) return message.update({});
            action_row.components[0].setDisabled(new_page === 0);
            action_row.components[1].setDisabled(new_page === 0);
            action_row.components[2].setDisabled(false);
            action_row.components[3].setDisabled(false);
            break;
          case "top":
            if (page === new_page) return message.update({});
            action_row.components[0].setDisabled(true);
            action_row.components[1].setDisabled(true);
            action_row.components[2].setDisabled(false);
            action_row.components[3].setDisabled(false);
            break;
          case "down":
            new_page = Math.min(page + 1, max_page);
            if (page === new_page) return message.update({});
            action_row.components[0].setDisabled(false);
            action_row.components[1].setDisabled(false);
            action_row.components[2].setDisabled(new_page === max_page);
            action_row.components[3].setDisabled(new_page === max_page);
            break;
          case "bottom":
            new_page = max_page;
            if (page === new_page) return message.update({});
            action_row.components[0].setDisabled(false);
            action_row.components[1].setDisabled(false);
            action_row.components[2].setDisabled(true);
            action_row.components[3].setDisabled(true);
            break;
          default:
            return message.update({});
        }

        page = new_page;

        await message.update({
          content:
            "```asciidoc\n" +
            queue.tracks
              .slice(MAX_PER_PAGE * page, MAX_PER_PAGE * (page + 1))
              .map((track) => {
                // @ts-ignore-next
                return `${track.index}# ${formatMilliseconds(
                  track.duration * 1000
                )} - ${track.title} from ${
                  track.metadata.requestedBy.username
                }`;
              })
              .join("\n") +
            "```",
          components: [action_row],
        });
      });

    await source.reply({
      content:
        "```asciidoc\n" +
        queue.tracks
          .slice(0, MAX_PER_PAGE)
          .map((track) => {
            // @ts-ignore-next
            return `${track.index}# ${formatMilliseconds(
              track.duration * 1000
            )} - ${track.title} from ${track.metadata.requestedBy.username}`;
          })
          .join("\n") +
        "```",
      components: [action_row],
    });
  }
}

export default new ListCommand();
