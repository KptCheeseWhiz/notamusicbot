import { ListCommand } from "./list";

export class LCommand extends ListCommand {
  readonly name: string = "l";
}

export default new LCommand();
