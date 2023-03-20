import { RateLimit, TIME_UNIT } from "@discordx/utilities";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder, MessageActionRowComponentBuilder } from "discord.js";
import { ButtonComponent, Discord, Guard } from "discordx";
import { HasSession } from "../guards/sessionGuard.js";
import { ButtonId, EMBED_COLOR, githubBodyFooter, ReportFieldId, reportTitlePrefixes, shared } from "../shared.js";
import { editOrReply, replyToInteraction } from "../utils/reply.js";
import { sendError } from "../utils/sendError.js";
import { sendToReportsChannel } from "../utils/sendToReportsChannel.js";
import { sessionToText } from "../utils/sessionToText.js";

const EMOJI = "<a:catChat:856958810110033930>";

const statusMessage = async (interaction: ButtonInteraction, text: string) => {
  const waitEmbed = new EmbedBuilder()
      .setTitle(`${EMOJI} ${text}`)
      .setColor(EMBED_COLOR);

  await editOrReply(interaction, {
    components: [],
    embeds: [ waitEmbed ],
    ephemeral: true
  })
}

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

    await statusMessage(interaction, "Создание репорта на GitHub...");

    const session = shared.reportSessions[interaction.user.id];
    const text = sessionToText(session);
    const body = text+githubBodyFooter
      .replace("${user}", interaction.user.tag)
      .replace("${id}", interaction.user.id);

    if (!process.env["REPORT_REPO"])
      throw Error("Could not find REPORT_REPO in your environment")

    const [ owner, repo ] = process.env["REPORT_REPO"].split("/");

    let issue;

    try {
      issue = await shared.octokit?.issues.create({
        owner, repo, body,
        title: `${reportTitlePrefixes[session.type]}: ${session[ReportFieldId.Title]}`,
        milestone: process.env["REPORT_MILESTONE"] || null
      });
    } catch (e) {
      return await sendError(interaction, e);
    } 

    if (!issue) return await replyToInteraction(interaction, {
      content: "Ошибка!\nРепорт не отправлен",
      ephemeral: true
    });

    delete shared.reportSessions[interaction.user.id];

    await statusMessage(interaction, "Создание репорта в Discord...");

    const reportTitle = `${reportTitlePrefixes[session.type]}: ${session[ReportFieldId.Title]}`;
    
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle(reportTitle)
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

    await statusMessage(interaction, "Открытие обсуждения...");

    const thread = await msg.startThread({
      name: reportTitle.slice(0, 100),
      reason: `Открытие GitHub Issue ${process.env["REPORT_REPO"]}#${issue.data.number}`
    })

    await statusMessage(interaction, "Указание обсуждения на GitHub...");

    try {
      await shared.octokit?.issues.createComment({
        owner, repo, issue_number: issue.data.number,
        body: `### [Обсуждение в Discord](${thread.url})`
      })
    } catch (e) { console.error("UNCATCHED! ERROR", e); }

    await statusMessage(interaction, "Уведомление об изображениях...");

    try {
      await thread.send(
        `<@!${interaction.user.id}>, сюда можно отправить `+
        "скриншоты или иные изображения, которые будут "+
        "полезны для понимания проблемы."
      );
    } catch (e) { console.error("UNCATCHED! ERROR", e); }

    return await editOrReply(interaction, {
      content:
        "**Репорт отправлен!**\n"+
        `- Ссылка на GitHub: ${issue.data.html_url}\n`+
        `- Копия в дискорде: ${msg.url}\n`+
        `- Обсуждение: <#${thread.id}>`,
      embeds: [ embed ],
      ephemeral: true
    });
  }
}