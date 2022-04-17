import { VoiceBasedChannel, MessageComponentInteraction } from "discord.js";
import { IAdapter } from "./adapters";

export const getInteractorVoiceChannel = async (
  source: IAdapter
): Promise<VoiceBasedChannel | null> => {
  return (await source.guild.members.fetch(source.member.user.id)).voice
    .channel;
};

export const componentCollectorFilter = (
  source: IAdapter,
  message: MessageComponentInteraction<"cached">
): boolean =>
  (message.message.interaction
    ? message.message.interaction.id
    : message.message.reference.messageId) === source.id &&
  message.applicationId === source.applicationId &&
  message.user.id === source.user.id;

export const sleep = async (ms: number) =>
  await new Promise((resolve) => setTimeout(resolve, ms).unref());

export const formatMilliseconds = (milliseconds: number, padStart = true) => {
  function pad(num: number) {
    return `${num}`.padStart(2, "0");
  }
  let asSeconds = milliseconds / 1000;

  let hours = undefined;
  let minutes = Math.floor(asSeconds / 60);
  let seconds = Math.floor(asSeconds % 60);

  if (minutes > 59) {
    hours = Math.floor(minutes / 60);
    minutes %= 60;
  }

  return hours
    ? `${padStart ? pad(hours) : hours}:${pad(minutes)}:${pad(seconds)}`
    : `${padStart ? pad(minutes) : minutes}:${pad(seconds)}`;
};

export const hoursFormatToSeconds = (hours: string): number => {
  const multipliers = [1, 60, 3600, 86400];
  return hours
    .split(":")
    .map(Number)
    .reverse()
    .reduce((a, b, i) => a + b * multipliers[i], 0);
};
