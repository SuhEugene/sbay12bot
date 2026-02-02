import { TextChannel } from "discord.js";
import { bot } from "../main.js";
import { readReports, reportsMap } from "../utils/githubReports.js";

export async function getMessageByIssue(issueNumber: number) {
  const guild = await bot.guilds.fetch(process.env["REPORT_GUILD"] as string);
  const channel: TextChannel = await guild.channels.fetch(process.env["REPORT_CHANNEL"] as string) as TextChannel;
  if (!channel) throw Error("Channel does not exist!");

  await readReports();
  const messageId = reportsMap.get(issueNumber);
  if (!messageId) return console.warn("Reports map has no issue number", issueNumber);

  const msg = await channel.messages.fetch(messageId);
  if (!msg) throw Error(`Message ${messageId} does not exist!`);

  return msg;
}
