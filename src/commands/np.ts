import { NowCommand } from "./now";

export class NpCommand extends NowCommand {
  readonly name: string = "np";
}

export default new NpCommand();
