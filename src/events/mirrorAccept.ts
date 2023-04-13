import { ButtonComponent, Discord } from "discordx";
import { ButtonId, EMBED_COLOR_SUCCESS, GithubLabel, githubLabels, mirrorPRs, shared } from "../shared.js";
import { APIEmbed, ButtonInteraction, EmbedBuilder } from "discord.js";
import { replyToInteraction } from "../utils/reply.js";

@Discord()
export class MirrorAccept {
  @ButtonComponent({ id: ButtonId.MirrorAccept })
  async acceptMirror(interaction: ButtonInteraction) {
    if (interaction.user.id != "706124306660458507") return await replyToInteraction(interaction, {
      content: "Пока что это тыкать может только Юджин!",
      ephemeral: true
    }); 
    const mirrors = await mirrorPRs.read();
    const mirror = mirrors.find(e => e.message == interaction.message.id);

    console.log(interaction.message.id, interaction.message);

    if (!mirror) return await replyToInteraction(interaction, {
      content: "Ошибка! PR не найден!",
      ephemeral: true
    });

    const [ owner, repo ] = (process.env["REPORT_REPO"] as string).split("/");

    await shared.octokit?.issues.addLabels({
      owner, repo,
      issue_number: mirror.pr_number,
      labels: [ githubLabels[GithubLabel.Accepted] ]
    });

    const embed = new EmbedBuilder(interaction.message.embeds[0] as APIEmbed)
      .setColor(EMBED_COLOR_SUCCESS)
      .setFooter({ text: "Принято" })
      .setTimestamp();
    
    await interaction.message.edit({
      embeds: [ embed ],
      components: []
    });

    mirrorPRs.data = (await mirrorPRs.read()).filter(el => el.message != interaction.message.id);
    await mirrorPRs.write();

    return await replyToInteraction(interaction, {
      content: "ПР принят!",
      ephemeral: true
    });
  }
}