import { EmbedBuilder } from "discord.js";
import { EmitterWebhookEvent } from "@octokit/webhooks";
import { getMessageByIssue } from "./getMessageByIssue.js";
import { EMBED_COLOR_DANGER, EMBED_COLOR_SUCCESS } from "../shared.js";

const titleByAction: {[index: string]: string} = {
  "assigned": 'Репорт взят!',
  "unassigned": 'Репорт скинут!'
}

const descriptionByAction: {[index: string]: (name: string) => string} = {
  "assigned": (name) => `Выполнять этот репорт был назначен ${name}`,
  "unassigned": (name) => `Назначение ${name} на выполнение репорта отменено`
}

const colorByAction: {[index: string]: number} = {
  "assigned": EMBED_COLOR_SUCCESS,
  "unassigned": EMBED_COLOR_DANGER
}

export async function issueAssigned(data: EmitterWebhookEvent<"issues.assigned"> | EmitterWebhookEvent<"issues.unassigned">) {
  const issueNumber = data.payload.issue.number;
  const issueAssignee = data.payload.assignee;
  const issueAction = data.payload.action;

  if (!issueAssignee) return;

  const msg = await getMessageByIssue(issueNumber);
  if (!msg) return console.warn(`WARNING! ${data.name}.${data.payload.action} Message for the issue #${issueNumber} not found!`);

  if (msg.thread) {
    const assigneeUsername = issueAssignee.name || issueAssignee.login;
    const threadEmbed = new EmbedBuilder()
      .setTitle(titleByAction[issueAction])
      .setDescription(descriptionByAction[issueAction](assigneeUsername))
      .setColor(colorByAction[issueAction])
      .setFooter({ text: assigneeUsername, iconURL: issueAssignee.avatar_url });
    await msg.thread.send({ embeds: [ threadEmbed ] });
  }
  return true;
};