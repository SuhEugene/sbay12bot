import { CommandInteraction } from "discord.js";
import type { GuardFunction, SimpleCommandMessage } from "discordx"
import { shared } from "../shared.js";
import { replyToInteraction } from "../utils/reply.js";
import { sendSessionEmbed } from "../utils/sendSessionEmbed.js";

export const HasNoSession: GuardFunction<CommandInteraction | SimpleCommandMessage> = async (arg, client, next) => {
  const interaction = arg instanceof Array ? arg[0] : arg;

  const session = shared.reportSessions[interaction.user.id];
  if (session)
    return await sendSessionEmbed(
      interaction,
      session,
      "Предыдущий репорт ещё не отправлен\n"+
      "Необходимо его отменить или отправить, прежде чем можно будет создать новый"
    );

  return await next();
}

export const HasSession: GuardFunction<CommandInteraction | SimpleCommandMessage> = async (arg, client, next) => {
  const interaction = arg instanceof Array ? arg[0] : arg;

  if (!shared.reportSessions[interaction.user.id])
    return await replyToInteraction(interaction, {
      content: "Сессия не найдена",
      ephemeral: true
    });

  return await next();
}
