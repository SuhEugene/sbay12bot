import { EmbedBuilder } from "discord.js";
import { EMBED_COLOR_CLOSED, EMBED_COLOR_DEFAULT, EMBED_COLOR_DISMISSED, EMBED_COLOR_OPEN } from "../shared.js";
import { EmitterWebhookEvent } from "@octokit/webhooks";
import { getMessage } from "./getMessageByIssue.js";

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

export async function issueComment(data: EmitterWebhookEvent<"issue_comment.created">) {
  const issueNumber = data.payload.issue.number;
  const commentURL = data.payload.comment.url;
  const commentText = data.payload.comment.body;
  const commentSender = data.payload.comment.user;

  const msg = await getMessage(issueNumber);
  if (!msg) return console.warn(`WARNING! ${data.name}.${data.payload.action} Message for the issue #${issueNumber} not found!`);

  if (msg.thread) {
    const senderName = commentSender.name || commentSender.login;
    const threadEmbed = new EmbedBuilder()
      .setTitle(`Комментарий \`${senderName}\``)
      .setURL(commentURL)
      .setDescription(commentText.slice(0, 1024))
      .setColor(EMBED_COLOR_DEFAULT)
      .setFooter({ text: senderName, iconURL: commentSender.avatar_url });
    await msg.thread.send({ embeds: [ threadEmbed ] });
  }
  return true;
};