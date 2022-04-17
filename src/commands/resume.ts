import { APIApplicationCommandOption } from "discord-api-types/v10";

import { Player } from "../player"
import { ICommand } from "../icommand";
import { IAdapter } from "../adapters";

export class ResumeCommand implements ICommand {
  readonly name: string = "resume";
  readonly description: string = "Resumes the current track";
  readonly options: APIApplicationCommandOption[] = [];
  readonly default_permission: boolean = true;

  async execute(source: IAdapter, player: Player) {
    const queue = await player.resolveWithChannel(source, false);
    if (!queue.playing)
      throw new Error("Not currently playing a track");
    await queue.resume();
    await source.reply("Resumed!");
  }
}

export default new ResumeCommand();
