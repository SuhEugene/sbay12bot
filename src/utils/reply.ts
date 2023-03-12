import { ButtonInteraction, CommandInteraction, InteractionReplyOptions, InteractionResponse, Message, MessageReplyOptions, ModalSubmitInteraction } from "discord.js"
import { SimpleCommandMessage } from "discordx"

/**
 * Abstraction level to reply to either a slash command or a simple command message.
 * @param interaction 
 * @param message 
 */
export async function replyToInteraction(
  interaction: CommandInteraction | SimpleCommandMessage | ModalSubmitInteraction | ButtonInteraction,
  message: string | (InteractionReplyOptions & MessageReplyOptions)
): Promise<Message<boolean> | InteractionResponse<boolean>> {
  
  if (interaction instanceof CommandInteraction ||
    interaction instanceof ModalSubmitInteraction ||
    interaction instanceof ButtonInteraction)
  {
    if (interaction.replied)
      return await interaction.followUp(message)
    else
      return await interaction.reply(message);
  }

  else if (interaction instanceof SimpleCommandMessage)
    return await interaction.message.reply(message)

  throw Error("Invalid interaction type!");
}