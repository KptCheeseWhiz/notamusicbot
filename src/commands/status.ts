import { APIApplicationCommandOption } from "discord-api-types/v10";

import { Player } from "../player";
import { ICommand } from "../icommand";
import { IAdapter } from "../adapters";
import { formatMilliseconds } from "../util";

export class StatusCommand implements ICommand {
  readonly name: string = "status";
  readonly description: string = "Shows information about the player";
  readonly options: APIApplicationCommandOption[] = [];
  readonly default_permission: boolean = true;

  async execute(source: IAdapter, player: Player) {
    const queue = await player.resolveWithChannel(source, false);
    await source.reply(
      `Total tracks: ${queue.tracks.length}\nPlaylist time: ${formatMilliseconds(queue.totalTime * 1000)}`
    );
  }
}

export default new StatusCommand();
