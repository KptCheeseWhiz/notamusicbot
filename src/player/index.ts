import { Client, Guild } from "discord.js";
import ytsr from "ytsr";
// import ytpl from "ytpl";

import { ITrack } from "./itrack";
import { Queue } from "./queue";
import { hoursFormatToSeconds } from "../util";
import { IAdapter } from "@/adapters";

const _queues: { [key: string]: Queue } = {};

// TODO handle playlists
export class Player {
  private _client: Client<true>;

  constructor(client: Client<true>) {
    this._client = client;
  }

  create(guildId: Guild | string) {
    if (guildId instanceof Guild) guildId = guildId.id;
    if (_queues[guildId]) throw new Error("queue already exists");
    return (_queues[guildId] = new Queue(
      this._client,
      this._client.guilds.resolve(guildId) as Guild
    ));
  }

  delete(guildId: Guild | string) {
    if (guildId instanceof Guild) guildId = guildId.id;
    if (!_queues[guildId]) throw new Error("queue does not exists");
    _queues[guildId].disconnect();
    delete _queues[guildId];
  }

  resolve(guildId: Guild | string) {
    if (guildId instanceof Guild) guildId = guildId.id;
    if (!_queues[guildId]) return this.create(guildId);
    return _queues[guildId];
  }

  async resolveWithChannel(source: IAdapter, autoconnect: boolean = true) {
    const queue = this.resolve(source.guild);

    const user_channel = (
      await source.guild.members.fetch(source.member.user.id)
    ).voice.channel;
    if (!user_channel) throw new Error("not in a voice channel");

    const bot_channel = (await source.guild.members.fetch(this._client.user.id))
      .voice.channel;
    if (bot_channel && user_channel.id !== bot_channel.id)
      throw new Error("not in the same channel as the bot");

    if ((!bot_channel || !queue.connection) && autoconnect)
      await queue.connect(user_channel);
    return queue;
  }

  async search(query: string, metadata?: any): Promise<ITrack | null> {
    const items = await ytsr(query, { pages: 1 }).then((r) => r.items);

    const item = items.find(
      (item) => item.type === "video" // || item.type == "playlist"
    );

    if (!item) return null;
    if (item.type === "video")
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        thumbnail: item.bestThumbnail,
        author: {
          name: item.author?.name,
          url: item.author?.url,
          avatar: item.author?.bestAvatar,
        },
        views: item.views,
        duration: item.duration ? hoursFormatToSeconds(item.duration) : -1,
        url: item.url,
        metadata,
      };
    /*else if (item.type == "playlist")
      const pl = await ytpl(item.playlistID);
      return {
        id: item.playlistID,
        title: pl.title,
        description: pl.description,
        author: {
          name: pl.author.name,
          url: pl.author.url,
          avatar: pl.author.bestAvatar,
        },
        views: pl.views,
        duration: pl.items.reduce((a, b) => a + (b?.durationSec || 0), 0),
        url: pl.url,
      };*/

    return null;
  }
}

export { Queue };
