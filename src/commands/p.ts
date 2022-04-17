import { PushCommand } from "./push";

export class PCommand extends PushCommand {
  readonly name: string = "p";
}

export default new PCommand();
