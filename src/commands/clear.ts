import { APIApplicationCommandOption } from "discord-api-types/v10";

import { Player } from "../player";
import { ICommand } from "../icommand";
import { IAdapter } from "../adapters";

export class ClearCommand implements ICommand {
  readonly name: string = "clear";
  readonly description: string = "Clears the playlist";
  readonly options: APIApplicationCommandOption[] = [];
  readonly default_permission: boolean = true;

  async execute(source: IAdapter, player: Player) {
    const queue = await player.resolveWithChannel(source, false);
    const tracks_cleared = await queue.clear();

    await source.reply(`Cleared **${tracks_cleared} tracks** from the playlist!`);
  }
}

export default new ClearCommand();
