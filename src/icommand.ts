import { APIApplicationCommandOption } from "discord-api-types/v10";
import { ApplicationCommandPermissionData, Guild } from "discord.js";

import { Player } from "./player";
import { IAdapter } from "./adapters";

export interface ICommand {
  readonly name: string;
  readonly description: string;
  readonly options: APIApplicationCommandOption[];
  readonly default_permission: boolean;

  execute: (source: IAdapter, player: Player) => Promise<any>;

  permissions?: (guild: Guild) => Promise<ApplicationCommandPermissionData[]>;
}
