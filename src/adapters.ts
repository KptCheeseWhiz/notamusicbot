import {
  APIInteractionGuildMember,
  ApplicationCommandOptionType,
} from "discord-api-types/v10";
import {
  Message,
  CommandInteraction,
  CacheType,
  InteractionReplyOptions,
  MessagePayload,
  ReplyMessageOptions,
  Client,
  Guild,
  TextBasedChannel,
  GuildMember,
  User,
} from "discord.js";

import { Player } from "./player";
import { findCommand } from "./commands";
import { ICommand } from "./icommand";

export interface IAdapter {
  id: string;
  applicationId: string;
  channelId: string;
  channel: TextBasedChannel;
  guildId: string;
  guild: Guild;
  client: Client<boolean>;
  member: GuildMember | APIInteractionGuildMember;

  user: User;
  commandName: string;
  command: ICommand;
  arguments: {
    [key: string]: any;
  };

  getArgument<T>(key: string, required?: boolean): T;

  execute(): Promise<void>;

  reply(
    options:
      | string
      | (InteractionReplyOptions & (MessagePayload | ReplyMessageOptions))
  ): Promise<void>;
  startThinking(): Promise<void>;
  stopThinking(): Promise<void>;

  toJSON(): unknown;
  toString(): string;
  valueOf(): string;
}

export class InteractionAdapter implements IAdapter {
  private _source: CommandInteraction<CacheType>;
  private _player: Player;

  public id: string;
  public applicationId: string;
  public channelId: string;
  public channel: TextBasedChannel;
  public guildId: string;
  public guild: Guild;
  public client: Client<boolean>;
  public member: GuildMember | APIInteractionGuildMember;

  public user: User;
  public commandName: string;
  public command: ICommand;
  public arguments: {
    [key: string]: any;
  };

  constructor(source: CommandInteraction<CacheType>, player: Player) {
    this._player = player;
    this._source = source;
    this.id = source.id;
    this.applicationId = source.applicationId || source.guild.applicationId;
    this.channelId = source.channelId;
    this.channel = source.channel;
    this.guildId = source.guildId;
    this.guild = source.guild;
    this.client = source.client;
    this.member = source.member as GuildMember | APIInteractionGuildMember;

    this.user = source.user;
    this.commandName = source.commandName;
    this.command = findCommand(this.commandName);
    this.arguments = source.options.data.reduce(
      (a, b) => ({ ...a, [b.name]: b.value }),
      {}
    );
  }

  getArgument<T>(key: string, required: boolean = false) {
    if (required && !(key in this.arguments))
      throw new Error(`Missing argument "${key}"`);
    return this.arguments[key] as T;
  }

  async execute() {
    const command = findCommand(this.commandName);
    if (!command) return;

    await this.startThinking();
    return await this.command
      .execute(this, this._player)
      .finally(() => this.stopThinking());
  }

  async reply(
    options:
      | string
      | (InteractionReplyOptions & (MessagePayload | ReplyMessageOptions))
  ) {
    if (this._source.deferred) await this._source.editReply(options);
    else await this._source.reply(options);
  }

  async startThinking() {
    await (this._source as CommandInteraction<CacheType>).deferReply();
  }

  async stopThinking() {
    return;
  }

  toJSON(): unknown {
    return this._source.toJSON();
  }

  toString(): string {
    return this._source.toString();
  }

  valueOf(): string {
    return this._source.valueOf();
  }
}

export class MessageAdapter implements IAdapter {
  private _source: Message<boolean>;
  private _player: Player;

  public id: string;
  public applicationId: string;
  public channelId: string;
  public channel: TextBasedChannel;
  public guildId: string;
  public guild: Guild;
  public client: Client<boolean>;
  public member: GuildMember | APIInteractionGuildMember;

  public user: User;
  public commandName: string;
  public command: ICommand;
  public arguments: {
    [key: string]: any;
  };

  constructor(source: Message<boolean>, player: Player) {
    this._player = player;

    this._source = source;
    this.id = source.id;
    this.applicationId = source.applicationId || source.guild.applicationId;
    this.channelId = source.channelId;
    this.channel = source.channel;
    this.guildId = source.guildId;
    this.guild = source.guild;
    this.client = source.client;
    this.member = source.member;

    this.user = source.member.user as User;

    const args = source.content.split(/"(.*?)"|\s/g).filter(Boolean);
    this.commandName = args.shift().substring(1);
    this.command = findCommand(this.commandName);
    if (this.command) {
      this.arguments = this.command.options.reduce((a, b, i) => {
        if (i >= args.length) return a;
        let value = args.shift();
        switch (b.type) {
          case ApplicationCommandOptionType.Boolean:
            value = value.toLowerCase();
            if (["0", "1", "true", "false"].indexOf(value) === -1)
              throw new Error(`Argument "${b.name}" is not a boolean`);
            a[b.name] = value[0] === "t" || value[0] === "1";
            break;
          case ApplicationCommandOptionType.String:
            a[b.name] = String(value);
            break;
          case ApplicationCommandOptionType.Number:
          case ApplicationCommandOptionType.Integer:
            a[b.name] = Number(value);
            if (isNaN(a[b.name]))
              throw new Error(`Argument "${b.name}" is not a number`);
            break;
          case ApplicationCommandOptionType.Channel:
          case ApplicationCommandOptionType.Mentionable:
          case ApplicationCommandOptionType.Role:
          case ApplicationCommandOptionType.Subcommand:
          case ApplicationCommandOptionType.SubcommandGroup:
          case ApplicationCommandOptionType.User:
            // not supported yet..
            throw new Error(`Please use the slash command equivalent instead`);
        }
        return a;
      }, {});

      const last_op = this.command.options[this.command.options.length - 1];
      if (
        args.length > 0 &&
        last_op.type === ApplicationCommandOptionType.String
      )
        this.arguments[last_op.name] = [
          this.arguments[last_op.name],
          ...args,
        ].join(" ");
    } else this.arguments = {};
  }

  getArgument<T>(key: string, required: boolean = false) {
    if (required && !(key in this.arguments))
      throw new Error(`Missing argument "${key}"`);
    return this.arguments[key] as T;
  }

  async execute() {
    const command = findCommand(this.commandName);
    if (!command) return;

    await this.startThinking();
    return await this.command
      .execute(this, this._player)
      .finally(() => this.stopThinking());
  }

  async reply(
    options:
      | string
      | (InteractionReplyOptions & (MessagePayload | ReplyMessageOptions))
  ) {
    this._source.reply(options);
  }

  async startThinking() {
    await this._source.react("💭");
  }

  async stopThinking() {
    await this._source.reactions.resolve("💭")?.users.remove(this.client.user);
  }

  toJSON(): unknown {
    return this._source.toJSON();
  }

  toString(): string {
    return this._source.toString();
  }

  valueOf(): string {
    return this._source.valueOf();
  }
}
