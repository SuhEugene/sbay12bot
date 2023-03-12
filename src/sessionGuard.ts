import { CommandInteraction } from "discord.js";
import type { GuardFunction, SimpleCommandMessage } from "discordx"
import { shared } from "./shared.js";
import { replyToInteraction } from "./utils/reply.js";

export const HasNoSession: GuardFunction<CommandInteraction | SimpleCommandMessage> = async (arg, client, next) => {
  const interaction = arg instanceof Array ? arg[0] : arg;

  if (shared.reportSessions[interaction.user.id])
    return await replyToInteraction(interaction, {
      content: "Предыдущий репорт ещё не отправлен\nНеобходимо его отправить, прежде чем начинать новый",
      ephemeral: true
    });
  
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