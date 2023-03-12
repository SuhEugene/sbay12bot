import type { ButtonInteraction } from "discord.js";
import { ButtonComponent, Discord, Guard } from "discordx";
import { HasSession } from "../sessionGuard.js";
import { ButtonId, shared } from "../shared.js";
import { replyToInteraction } from "../utils/reply.js";

@Discord()
export class ReportCancel {
  @Guard(HasSession)
  @ButtonComponent({ id: ButtonId.ReportCancel })
  async cancelReport(interaction: ButtonInteraction) {
    delete shared.reportSessions[interaction.user.id];
    return await replyToInteraction(interaction, {
      content: "Отменено",
      // ephemeral: true
    });
  }
}