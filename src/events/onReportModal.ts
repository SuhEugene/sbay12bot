import { EmbedBuilder, ModalSubmitInteraction } from "discord.js";
import { EMBED_COLOR, ReportFieldId, reportTitlePrefixes, ReportType, ReportTypedData, sendOrAddInfoReportRow, shared } from "../shared.js";
import { replyToInteraction } from "../utils/reply.js";
import { sessionToText } from "../utils/sessionToText.js";

export async function onReportModal(interaction: ModalSubmitInteraction, type?: ReportType) {
  const reportFields: {[index: string]: any} = {};

  let session: ReportTypedData = shared.reportSessions[interaction.user.id];

  if (!session) {
    if (type !== null && type !== undefined) session = { type, [ReportFieldId.Title]: reportFields[ReportFieldId.Title] };
    else return await replyToInteraction(interaction, {
      content: "Невозможно создать сессию",
      // ephemeral: true
    });
  }

  for (const field in ReportFieldId) {
    const f: keyof typeof ReportFieldId = field as any;
    if (interaction.fields.fields.has(ReportFieldId[f]))
      session[ReportFieldId[f]] = interaction.fields.getTextInputValue(ReportFieldId[f]);
  }

  shared.reportSessions[interaction.user.id] = session;

  const embed = new EmbedBuilder().setColor(EMBED_COLOR);

  session[ReportFieldId.Title] &&
    embed.setTitle(`${reportTitlePrefixes[session.type]}: ${session[ReportFieldId.Title]}`);

  embed.setDescription(sessionToText(session));
  
  return await replyToInteraction(interaction, {
    embeds: [ embed ],
    components: [ sendOrAddInfoReportRow ],
    // ephemeral: true
  });
}