import { SkipCommand } from "./skip";

export class SCommand extends SkipCommand {
  readonly name: string = "s";
}

export default new SCommand();
