import { EmbedBuilder, ModalSubmitInteraction } from "discord.js";
import { EMBED_COLOR_DEFAULT, ReportFieldId, reportTitlePrefixes, ReportTypedData, sendOrAddInfoReportRow } from "../shared.js";
import { sessionToText } from "./sessionToText.js";
import { replyToInteraction } from "./reply.js";
import { sanitOut } from "./sanitOut.js";

export async function sendSessionEmbed(interaction: ModalSubmitInteraction, session: ReportTypedData, content?: string) {
  const embed = new EmbedBuilder().setColor(EMBED_COLOR_DEFAULT);

  session[ReportFieldId.Title] &&
    embed.setTitle(`${reportTitlePrefixes[session.type]}: ${session[ReportFieldId.Title]}`);

  embed.setDescription(sessionToText(session));

  return await replyToInteraction(interaction, {
    content: content && sanitOut(content),
    embeds: [embed],
    components: [sendOrAddInfoReportRow],
    ephemeral: true
  });
}
