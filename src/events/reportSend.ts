import { RateLimit, TIME_UNIT } from "@discordx/utilities";
import { ButtonInteraction, EmbedBuilder } from "discord.js";
import { ButtonComponent, Discord, Guard } from "discordx";
import { HasSession } from "../sessionGuard.js";
import { ButtonId, githubBodyFooter, ReportFieldId, reportTitlePrefixes, shared } from "../shared.js";
import { replyToInteraction } from "../utils/reply.js";
import { sendToReportsChannel } from "../utils/sendToReportsChannel.js";
import { sessionToText } from "../utils/sessionToText.js";

@Discord()
export class ReportSend {
  @Guard(
    HasSession,
    RateLimit(TIME_UNIT.minutes, 8, {
      message: "Отправка репортов разрешена только 2 раза в 8 минут!",
      rateValue: 2,
      ephemeral: true
    })
  )
  @ButtonComponent({ id: ButtonId.ReportSend })
  async sendReport(interaction: ButtonInteraction) {
    const session = shared.reportSessions[interaction.user.id];
    const text = sessionToText(session);
    const body = text+githubBodyFooter
      .replace("${user}", interaction.user.tag)
      .replace("${id}", interaction.user.id);

    if (!process.env["REPORT_REPO"])
      throw Error("Could not find REPORT_REPO in your environment")

    const [ owner, repo ] = process.env["REPORT_REPO"].split("/");

    const issue = await shared.octokit?.issues.create({
      owner, repo, body,
      title: `${reportTitlePrefixes[session.type]}: ${session[ReportFieldId.Title]}`,
      // milestone: 3
    });

    if (!issue) return await replyToInteraction(interaction, {
      content: "Ошибка!\nРепорт не отправлен",
      // ephemeral: true
    });

    const embed = new EmbedBuilder()
      .setColor("#85bab6")
      .setTitle(`${reportTitlePrefixes[session.type]}: ${session[ReportFieldId.Title]}`)
      .setDescription(text)
      .setURL(issue.data.html_url)
      .setAuthor({
        name: interaction.user.tag,
        iconURL: interaction.user.avatarURL() || undefined
      }).setTimestamp()

    await sendToReportsChannel(interaction, { embeds: [ embed ] });

    delete shared.reportSessions[interaction.user.id];

    return await replyToInteraction(interaction, {
      content: "Репорт отправлен\n"+issue.data.html_url,
      embeds: [ embed ]
      // ephemeral: true
    });
  }
}