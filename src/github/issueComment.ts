import { EmbedBuilder } from "discord.js";
import { EMBED_COLOR_CLOSED, EMBED_COLOR_DEFAULT, EMBED_COLOR_DISMISSED, EMBED_COLOR_OPEN } from "../shared.js";
import { EmitterWebhookEvent } from "@octokit/webhooks";
import { getMessage } from "./getMessageByIssue.js";

export async function issueComment(data: EmitterWebhookEvent<"issue_comment.created">) {
  const issueNumber = data.payload.issue.number;
  const commentURL = data.payload.comment.url;
  const commentText = data.payload.comment.body;
  const commentSender = data.payload.comment.user;
  if (commentSender.id == 125094432) return;

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