import { ButtonComponent, Discord } from "discordx";
import { ButtonId, EMBED_COLOR_DEFAULT, GithubLabel, githubLabels, mirrorPRs, shared } from "../shared.js";
import { APIEmbed, ButtonInteraction, EmbedBuilder } from "discord.js";
import { replyToInteraction } from "../utils/reply.js";

@Discord()
export class MirrorVote {
  @ButtonComponent({ id: ButtonId.MirrorVote })
  async acceptMirror(interaction: ButtonInteraction) {
    if (interaction.user.id != "706124306660458507") return await replyToInteraction(interaction, {
      content: "Пока что это тыкать может только Юджин!",
      ephemeral: true
    }); 
    const mirrors = await mirrorPRs.read();
    const mirror = mirrors.find(e => e.message == interaction.message.id);

    if (!mirror) return await replyToInteraction(interaction, {
      content: "Ошибка! PR не найден!",
      ephemeral: true
    });

    const [ owner, repo ] = (process.env["REPORT_REPO"] as string).split("/");

    await shared.octokit?.issues.addLabels({
      owner, repo,
      issue_number: mirror.pr_number,
      labels: [ githubLabels[GithubLabel.Vote] ]
    });

    const embed = new EmbedBuilder(interaction.message.embeds[0] as APIEmbed)
      .setColor(EMBED_COLOR_DEFAULT)
      .setFooter({
        text: interaction.user.tag,
        iconURL: interaction.user.avatarURL() || undefined
      })
      .setAuthor({ name: "Голосование" })
      .setTimestamp();
    
    await interaction.message.edit({
      embeds: [ embed ],
      components: []
    });

    const thread = await interaction.message.startThread({
      name: (embed.data.title as string).replace(/\[MIRROR\] ?/i, '')
    });

    const mirrorsCopy = (await mirrorPRs.read()).filter(el => el.message != interaction.message.id);
    mirrorsCopy.push({
      pr_number: mirror.pr_number,
      message: mirror.message,
      started_at: thread.createdTimestamp as number
    });
    mirrorPRs.data = mirrorsCopy;
    mirrorPRs.write();

    thread.send("https://cdn.discordapp.com/attachments/678945662368350238/1095794550385168474/vote.mp3");

    return await replyToInteraction(interaction, {
      content: "Голосование начато!",
      ephemeral: true
    });
  }
}