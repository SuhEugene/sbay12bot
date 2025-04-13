import { ModalSubmitInteraction } from "discord.js";
import { ReportFieldId, ReportType, ReportTypedData, shared } from "../shared.js";
import { replyToInteraction } from "../utils/reply.js";
import { sendSessionEmbed } from "../utils/sendSessionEmbed.js";

export async function onReportModal(interaction: ModalSubmitInteraction, type?: ReportType) {
  const reportFields: {[index: string]: any} = {};

  let session: ReportTypedData = shared.reportSessions[interaction.user.id];

  if (!session) {
    if (type !== null && type !== undefined) session = { type, [ReportFieldId.Title]: reportFields[ReportFieldId.Title] };
    else return await replyToInteraction(interaction, {
      content: "Невозможно создать сессию",
      ephemeral: true
    });
  }

  for (const field in ReportFieldId) {
    const f: keyof typeof ReportFieldId = field as any;
    if (interaction.fields.fields.has(ReportFieldId[f]))
      session[ReportFieldId[f]] = interaction.fields.getTextInputValue(ReportFieldId[f]);
  }

  shared.reportSessions[interaction.user.id] = session;

  return await sendSessionEmbed(interaction, session);
}
