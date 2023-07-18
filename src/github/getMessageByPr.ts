import { TextChannel } from "discord.js";
import { bot } from "../main.js";
import { unmergedPRs } from "../shared.js";

export async function getMessageByPr(prNumber: number) {
  const guild = await bot.guilds.fetch(process.env["REPORT_GUILD"] as string);
  const channel = await guild.channels.fetch(process.env["MIRROR_CHANNEL"] as string) as TextChannel;
  if (!channel) throw Error("Channel does not exist!");

  const prs = await unmergedPRs.read();
  const messageId = prs.find(pr => pr.pr_number == prNumber)?.message;
  if (!messageId) return;

  const msg = await channel.messages.fetch(messageId);
  if (!msg) return;

  return msg;
}