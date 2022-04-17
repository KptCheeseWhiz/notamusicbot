import { EventEmitter } from "events";

import {
  BaseGuildVoiceChannel,
  Client,
  Guild,
  GuildTextBasedChannel,
  MessageEmbed,
} from "discord.js";
import {
  AudioPlayer,
  AudioPlayerState,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  PlayerSubscription,
  VoiceConnection,
  VoiceConnectionState,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import ytdl from "ytdl-core";
import { shuffle as _shuffle } from "lodash";

import { ITrack } from "./itrack";
import { sleep } from "../util";

// TODO use eventemitter to reduce class complexity
export class Queue extends EventEmitter {
  private _client: Client<true>;
  private _guild: Guild;
  private _channel: GuildTextBasedChannel;
  private _index: number = 1;

  private _connection: VoiceConnection | null = null;
  private _audioplayer: AudioPlayer | null = null;
  private _subscription: PlayerSubscription | null = null;

  private _tracks: (ITrack & { index: number })[] = [];

  constructor(client: Client<true>, guild: Guild) {
    super();
    this._client = client;
    this._guild = guild;
    this._channel = guild.channels.cache.find(
      (channel) =>
        channel.name === this._client.user.username &&
        channel.type === "GUILD_TEXT"
    ) as GuildTextBasedChannel;

    this._audioplayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });
    this._audioplayer
      .on(
        "stateChange",
        async (oldState: AudioPlayerState, newState: AudioPlayerState) => {
          // console.log("audioplayer", oldState.status, newState.status);
          if (
            oldState.status === AudioPlayerStatus.Playing &&
            newState.status === AudioPlayerStatus.AutoPaused
          )
            await this.resume();
          else if (
            oldState.status === AudioPlayerStatus.Playing &&
            newState.status === AudioPlayerStatus.Idle
          ) {
            const next = await this.skip();
            if (!next) {
              this.disconnect();
              return;
            }

            this._channel.send({
              content: `Now playing **${next.title}**`,
              embeds: [
                new MessageEmbed()
                  .setTitle(next.title || "")
                  .setDescription(next.description || "")
                  .setThumbnail(next.thumbnail.url || "")
                  .setURL(next.url || ""),
              ],
            });
          } else if (
            newState.status === AudioPlayerStatus.Idle &&
            this._tracks.length === 0
          ) {
            this.disconnect();
          }
        }
      )
      .on("error", console.error.bind(null, "audioplayer"));
  }

  public get connection() {
    return this._connection;
  }

  public get audioplayer() {
    return this._audioplayer;
  }

  public get playing() {
    return this._tracks[0];
  }

  public get tracks() {
    return this._tracks;
  }

  public get totalTime() {
    return this._tracks.reduce((a, b) => a + b.duration, 0);
  }

  public async connect(channel: BaseGuildVoiceChannel) {
    this._connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: this._guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    this._connection
      /*.on(
        "stateChange",
        async (
          oldState: VoiceConnectionState,
          newState: VoiceConnectionState
        ) => {
          console.log("connection", oldState.status, newState.status);
        }
      )*/
      .on("error", console.error.bind(null, "connection"));

    this._subscription = this._connection.subscribe(this._audioplayer);

    while (this._connection.state.status !== VoiceConnectionStatus.Ready)
      await sleep(250);
  }

  public disconnect() {
    this._subscription?.unsubscribe();
    this._connection?.disconnect();
    this._connection?.destroy();
    this._connection = null;
    this._index = 1;
  }

  public play(track: ITrack) {
    const stream = ytdl(track.url, {
      filter: "audioonly",
      highWaterMark: 1 << 62,
      liveBuffer: 1 << 62,
      dlChunkSize: 0,
    });
    const resource = createAudioResource(stream);
    this._audioplayer.play(resource);
  }

  public async push(track: ITrack, autoplay: boolean = true) {
    if (
      this._tracks.push({ ...track, index: this._index++ }) === 1 &&
      autoplay
    ) {
      this.play(track);
    }
  }

  public async unshift(track: ITrack, autoplay: boolean = true) {
    if (
      this._tracks.unshift({ ...track, index: this._index++ }) === 1 &&
      autoplay
    ) {
      this.play(track);
    }
  }

  public async remove(index: { index: number } | number): Promise<ITrack> {
    if (typeof index !== "number") index = index.index;
    const trackIndex = this._tracks.findIndex((track) => track.index === index);
    if (trackIndex === -1) throw new Error(`Unable to remove track #${index}`);
    return this._tracks.splice(trackIndex, 1)[0];
  }

  public async skip(): Promise<ITrack | null> {
    if (this._tracks.length === 0) return null;
    this._tracks.shift();

    if (this._tracks.length === 0) {
      await this.stop();
      return null;
    }

    const next = this._tracks[0];
    this.play(next);

    return next;
  }

  public async clear(): Promise<number> {
    return this._tracks.splice(1).length;
  }

  public async togglepause(): Promise<boolean> {
    if (this._audioplayer.state.status === AudioPlayerStatus.Paused)
      return await this.resume();
    else if (
      this._audioplayer.state.status === AudioPlayerStatus.Playing ||
      this._audioplayer.state.status === AudioPlayerStatus.Buffering
    )
      return await this.pause();
    throw new Error("I am neither paused nor playing");
  }

  public async pause(): Promise<boolean> {
    if (
      this._audioplayer.state.status !== AudioPlayerStatus.Playing &&
      this._audioplayer.state.status !== AudioPlayerStatus.Buffering
    )
      throw new Error("I am already in pause or not playing");
    for (let i = 0; i < 4; ++i) {
      if (this._audioplayer.pause()) return true;
      await sleep(250);
    }
    return false;
  }

  public async resume(): Promise<boolean> {
    if (
      this._audioplayer.state.status !== AudioPlayerStatus.Paused &&
      this._audioplayer.state.status !== AudioPlayerStatus.AutoPaused
    )
      throw new Error("I am not in pause");
    for (let i = 0; i < 4; ++i) {
      if (this._audioplayer.unpause()) return true;
      await sleep(250);
    }
    return false;
  }

  public async stop(): Promise<boolean> {
    for (let i = 0; i < 4; ++i) {
      if (this._audioplayer.stop()) return true;
      await sleep(250);
    }
    return false;
  }

  public shuffle() {
    this._tracks[0].index = 1;
    const tracks = _shuffle(this._tracks.splice(1));
    for (let i = 0; i < tracks.length; ++i) tracks[i].index = i + 2;
    this._tracks.push(...tracks);
  }
}
