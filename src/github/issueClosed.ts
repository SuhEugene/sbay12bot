import { EmbedBuilder, TextChannel } from "discord.js";
import { bot, webhooks } from "../main.js";
import { EMBED_COLOR_CLOSED, EMBED_COLOR_DISMISSED, EMBED_COLOR_OPEN } from "../shared.js";
import { readReports, reportsMap } from "../utils/githubReports.js";
import { EmitterWebhookEvent } from "@octokit/webhooks";

async function getMessage(issueNumber: number) {
  const guild = await bot.guilds.fetch(process.env["REPORT_GUILD"] as string);
  const channel: TextChannel = await guild.channels.fetch(process.env["REPORT_CHANNEL"] as string) as TextChannel;
  if (!channel) throw Error("Channel does not exist!");

  await readReports();
  const messageId = reportsMap.get(issueNumber);
  if (!messageId) return;

  const msg = await channel.messages.fetch(messageId);
  if (!msg) throw Error(`Message ${messageId} does not exist!`);

  return msg;
}

enum IssueStatus {
  OPEN = "open",
  COMPLETED = "completed",
  NOT_PLANNED = "not planned"
}
type ByStatus<T> = {[index: string]: T}

const colorByStatus: ByStatus<number> = {
  [IssueStatus.NOT_PLANNED]: EMBED_COLOR_DISMISSED,
  [IssueStatus.COMPLETED]: EMBED_COLOR_CLOSED,
  [IssueStatus.OPEN]: EMBED_COLOR_OPEN
}

const titleByStatus: ByStatus<string> = {
  [IssueStatus.NOT_PLANNED]: "Отклонён",
  [IssueStatus.COMPLETED]: "Завершён",
  [IssueStatus.OPEN]: "Переоткрыт"
}

const descriptionByStatus: ByStatus<string> = {
  [IssueStatus.NOT_PLANNED]: "Работа по решению описанных в репорте проблем производиться не будет",
  [IssueStatus.COMPLETED]: "Проблемы, описанные в репорте, решены",
  [IssueStatus.OPEN]: "Работа по решению описанных в репорте проблем возобновлена"
}

webhooks.onAny(async data => {
  console.log(data.name, "event received");
  if (data.name == "issues")
    console.log(data.payload.action, data);

  if (data.name == "issues" && ["closed", "reopened"].includes(data.payload.action))
    return await issueClosed(data as EmitterWebhookEvent<"issues.closed"> | EmitterWebhookEvent<"issues.reopened">);
});

async function issueClosed(data: EmitterWebhookEvent<"issues.closed"> | EmitterWebhookEvent<"issues.reopened">) {
  const issueNumber = data.payload.issue.number;
  const issueState = data.payload.issue.state;
  const issueReason = data.payload.issue.state_reason;

  let status: string = issueState;
  if (issueState == "closed")
    status = issueReason == IssueStatus.NOT_PLANNED ? IssueStatus.NOT_PLANNED : IssueStatus.COMPLETED;
  
  const msg = await getMessage(issueNumber);
  if (!msg) return;

  const newEmbed = new EmbedBuilder(msg.embeds[0].data)
    .setColor(colorByStatus[status])
    .setFooter({ text: titleByStatus[status] })
    .setTimestamp();
  
  await msg.edit({ embeds: [ newEmbed ] });

  if (msg.thread) {
    const threadEmbed = new EmbedBuilder()
      .setTitle(`Новый статус репорта: **${titleByStatus[status]}**`)
      .setDescription(descriptionByStatus[status])
      .setColor(colorByStatus[status]);
    await msg.thread.send({ embeds: [ threadEmbed ] });
  }
  return true;
};