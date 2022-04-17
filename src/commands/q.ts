import { APIApplicationCommandOption } from "discord-api-types/v10";

import { Player } from "../player";
import { ICommand } from "../icommand";
import { IAdapter } from "../adapters";
import ListCommand from "./list";
import PlayCommand from "./play";

export class QCommand implements ICommand {
  readonly name: string = "q";
  readonly description: string = "List or pushes a track to the playlist";
  readonly options: APIApplicationCommandOption[] = [
    {
      name: "query",
      description: "The query to search a track",
      type: 3,
      required: false,
    },
  ];
  readonly default_permission: boolean = true;

  async execute(
    source: IAdapter,
    player: Player
  ): Promise<void> {
    const query = source.getArgument<string>("query");
    if (!query) return ListCommand.execute(source, player);
    return PlayCommand.execute(source, player);
  }
}

export default new QCommand();
