import { RateLimit, TIME_UNIT } from "@discordx/utilities";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder, MessageActionRowComponentBuilder } from "discord.js";
import { ButtonComponent, Discord, Guard } from "discordx";
import { HasSession } from "../sessionGuard.js";
import { ButtonId, EMBED_COLOR, githubBodyFooter, ReportFieldId, reportTitlePrefixes, shared } from "../shared.js";
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

    delete shared.reportSessions[interaction.user.id];
    
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle(`${reportTitlePrefixes[session.type]}: ${session[ReportFieldId.Title]}`)
      .setDescription(text)
      .setURL(issue.data.html_url)
      .setAuthor({
        name: interaction.user.tag,
        iconURL: interaction.user.avatarURL() || undefined
      }).setTimestamp()

    const githubButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setURL(issue.data.html_url)
      .setLabel(`GitHub Issue #${issue.data.number}`)
    
    const githubRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(githubButton);

    const msg = await sendToReportsChannel(interaction, {
      embeds: [ embed ], components: [ githubRow ]
    });

    return await replyToInteraction(interaction, {
      content:
        "**Репорт отправлен!**\n"+
        `- Ссылка на GitHub: ${issue.data.html_url}\n`+
        `- Копия в дискорде: ${msg.url}`,
      embeds: [ embed ]
      // ephemeral: true
    });
  }
}