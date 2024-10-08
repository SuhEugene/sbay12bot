import generatePrEmbed from "../utils/generatePrEmbed.js";
import { EmitterWebhookEvent } from "@octokit/webhooks";
import { getMessageByPr } from "./getMessageByPr.js";
import type {  TextChannel } from "discord.js";
import { bot } from "../main.js";
import { unmergedPRs } from "../shared.js";

type PrOpenDataTypes =
    EmitterWebhookEvent<"pull_request.opened">
  | EmitterWebhookEvent<"pull_request.closed">
  | EmitterWebhookEvent<"pull_request.reopened">
  | EmitterWebhookEvent<"pull_request.ready_for_review">
  | EmitterWebhookEvent<"pull_request.converted_to_draft">;

type Status = "closed" | "open" | "merged" | "draft";

export async function prOpenUpdate(data: PrOpenDataTypes) {
  const pr = data.payload.pull_request;
  let status: Status = pr.state;
  if (pr.draft) status = "draft";
  if (pr.merged_at) status = "merged";

  const guild = await bot.guilds.fetch(process.env["REPORT_GUILD"] as string);
  const channel = await guild.channels.fetch(process.env["MIRROR_CHANNEL"] as string) as TextChannel;

  console.log(`PR #${pr.number} is ${status} now`);

  const msg = await getMessageByPr(pr.number);
  if (msg && msg.deletable) await msg.delete();

  const newEmbed = generatePrEmbed(pr.title, pr.body || "", status, pr.user, pr.html_url);
  const sentMsg = await channel.send({ embeds: [ newEmbed ] });

  unmergedPRs.data = (await unmergedPRs.read()).filter(p => p.pr_number != pr.number);
  await unmergedPRs.write();
  if (pr.state != "closed")
    await unmergedPRs.push({ pr_number: pr.number, message: sentMsg.id });

  try {
    const changelogChannel = await guild.channels.fetch(process.env["CHANGELOG_CHANNEL"] as string) as TextChannel;
    if (status === "merged")
      await changelogChannel.send({ embeds: [ newEmbed ] })
  } catch (e) {
    console.error("UNCAUGHT! ERROR", e);
  }

  return true;
};
