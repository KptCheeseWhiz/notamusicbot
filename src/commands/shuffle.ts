import { APIApplicationCommandOption } from "discord-api-types/v10";

import { Player } from "../player";
import { ICommand } from "../icommand";
import { IAdapter } from "../adapters";

export class ShuffleCommand implements ICommand {
  readonly name: string = "shuffle";
  readonly description: string = "Shuffles the playlist";
  readonly options: APIApplicationCommandOption[] = [];
  readonly default_permission: boolean = true;

  async execute(source: IAdapter, player: Player) {
    const queue = await player.resolveWithChannel(source, false);

    if (queue.tracks.length <= 1)
      throw new Error("There are no tracks to shuffle");
    await queue.shuffle();
    await source.reply("Shuffled!");
  }
}

export default new ShuffleCommand();
