import { CommandInteraction, GuildMember, Role } from "discord.js";
import { GuardFunction } from "discordx";
import { replyToInteraction } from "../utils/reply";
import { sendError } from "../utils/sendError";

export const HasMinionRole: GuardFunction<CommandInteraction> = async (arg, client, next) => {
  const interaction: CommandInteraction = arg instanceof Array ? arg[0] : arg;

  if (!interaction.member || !interaction.guild) return;
  if (!process.env["MINION_ROLE"])
    throw Error(`Environment role MINION_ROLE (${process.env["MINION_ROLE"]}) does not exist!`);

  let mbr: GuildMember | null = null;
  let role: Role | null = null;
  try {
    mbr = await interaction.guild.members.fetch(interaction.user.id);
    role = await interaction.guild.roles.fetch(process.env["MINION_ROLE"]);
  } catch (e) {
    return await sendError(interaction, e);
  }
  if (!mbr || !mbr.id) return;
  if (!role || !role.id) return;
  
  if (!mbr.roles.cache.has(role.id))
    return await replyToInteraction(interaction, {
      content: `Репорт может сделать только обладатель роли \`${role.name}\``,
      ephemeral: true
    });
  
  return await next();
}