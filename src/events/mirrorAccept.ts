import { ButtonComponent, Discord } from "discordx";
import { ButtonId, EMBED_COLOR_SUCCESS, GithubLabel, githubLabels, mirrorPRs, shared } from "../shared.js";
import { APIEmbed, ButtonInteraction, EmbedBuilder } from "discord.js";
import { replyToInteraction } from "../utils/reply.js";
import { mirrorAccept } from "../utils/mirrorTools.js";
import { sanitOut } from "../utils/sanitOut.js";

@Discord()
export class MirrorAccept {
  @ButtonComponent({ id: ButtonId.MirrorAccept })
  async acceptMirror(interaction: ButtonInteraction) {
    if (interaction.user.id != "706124306660458507" && interaction.user.id != (process.env["SPECIAL"] as string)) return await replyToInteraction(interaction, {
      content: "Пока что это тыкать может только Юджин!",
      ephemeral: true
    }); 

    const error = await mirrorAccept(interaction.message, interaction.user);
    if (error) return await replyToInteraction(interaction, {
      content: sanitOut("Ошибка! "+error),
      ephemeral: true
    });

    return await replyToInteraction(interaction, {
      content: "ПР принят!",
      ephemeral: true
    });
  }
}
