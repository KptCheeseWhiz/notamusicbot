import { APIApplicationCommandOption } from "discord-api-types/v10";

import { Player } from "../player";
import { ICommand } from "../icommand";
import { IAdapter } from "../adapters";

export class RemoveCommand implements ICommand {
  readonly name: string = "remove";
  readonly description: string = "Removes a song from the playlist";
  readonly options: APIApplicationCommandOption[] = [
    {
      name: "track_id",
      description: "The id of the track to remove",
      type: 4,
      required: true,
    },
  ];
  readonly default_permission: boolean = true;

  async execute(source: IAdapter, player: Player) {
    const queue = await player.resolveWithChannel(source, false);
    const track_id = source.getArgument<number>("track_id", true);

    await queue.remove(track_id);
    await source.reply(`Removed track #${track_id} from the playlist!`);
  }
}

export default new RemoveCommand();
