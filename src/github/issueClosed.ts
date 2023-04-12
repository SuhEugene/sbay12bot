import { EmbedBuilder } from "discord.js";
import { EMBED_COLOR_CLOSED, EMBED_COLOR_DISMISSED, EMBED_COLOR_OPEN } from "../shared.js";
import { EmitterWebhookEvent } from "@octokit/webhooks";
import { getMessageByIssue } from "./getMessageByIssue.js";

enum IssueStatus {
  OPEN = "open",
  COMPLETED = "completed",
  NOT_PLANNED = "not_planned"
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

export async function issueClosed(data: EmitterWebhookEvent<"issues.closed"> | EmitterWebhookEvent<"issues.reopened">) {
  const issueNumber = data.payload.issue.number;
  const issueState = data.payload.issue.state;
  const issueReason = data.payload.issue.state_reason;
  const issueSender = data.payload.sender;

  let status: string = issueState;
  if (issueState == "closed")
    status = issueReason == IssueStatus.NOT_PLANNED ? IssueStatus.NOT_PLANNED : IssueStatus.COMPLETED;
  
  console.log(`Issue #${issueNumber} is ${status} now`);

  const msg = await getMessageByIssue(issueNumber);
  if (!msg) return console.warn(`WARNING! ${data.name}.${data.payload.action} Message for the issue #${issueNumber} not found!`);

  const newEmbed = new EmbedBuilder(msg.embeds[0].data)
    .setColor(colorByStatus[status])
    .setFooter({ text: titleByStatus[status] })
    .setTimestamp();
  
  await msg.edit({ embeds: [ newEmbed ] });

  if (msg.thread) {
    const senderName = issueSender.name || issueSender.login;
    const threadEmbed = new EmbedBuilder()
      .setTitle(`Новый статус репорта: **${titleByStatus[status]}**`)
      .setDescription(descriptionByStatus[status])
      .setColor(colorByStatus[status])
      .setFooter({ text: senderName, iconURL: issueSender.avatar_url });
      await msg.thread.send({ embeds: [ threadEmbed ] });
  }
  return true;
};