import { APIApplicationCommandOption } from "discord-api-types/v10";

import { Player } from "../player";
import { ICommand } from "../icommand";
import { IAdapter } from "../adapters";

export class PauseCommand implements ICommand {
  readonly name: string = "pause";
  readonly description: string = "Pauses the current track";
  readonly options: APIApplicationCommandOption[] = [];
  readonly default_permission: boolean = true;

  async execute(source: IAdapter, player: Player) {
    const queue = await player.resolveWithChannel(source, false);
    if (!queue.playing)
      throw new Error("Not currently playing a track");

    await queue.pause();
    await source.reply("Paused!");
  }
}

export default new PauseCommand();
