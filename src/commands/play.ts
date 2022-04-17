import { PushCommand } from "./push";

export class PlayCommand extends PushCommand {
  readonly name: string = "play";
}

export default new PlayCommand();
