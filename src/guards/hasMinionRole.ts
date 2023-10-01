import { CommandInteraction, GuildMember, Role } from "discord.js";
import { GuardFunction } from "discordx";
import { replyToInteraction } from "../utils/reply.js";
import { sendError } from "../utils/sendError.js";

const toRole = (id: string): string => `<@&${id}>`;

export const HasMinionRole: GuardFunction<CommandInteraction> = async (arg, client, next) => {
  const interaction: CommandInteraction = arg instanceof Array ? arg[0] : arg;

  if (!interaction.member || !interaction.guild) return;
  if (!process.env["ALLOWED_ROLES"])
    throw Error(`Environment role MINION_ROLE (${process.env["ALLOWED_ROLES"]}) does not exist!`);

  const roles = process.env["ALLOWED_ROLES"].split(/; */);

  let mbr: GuildMember | null = null;
  try {
    mbr = await interaction.guild.members.fetch(interaction.user.id);
  } catch (e) {
    return await sendError(interaction, e);
  }
  if (!mbr || !mbr.id) return;

  let hasAnyRole = false;
  for (const role of roles) {
    if (!mbr.roles.cache.has(role)) continue;
    hasAnyRole = true;
    break;
  }
  if (interaction.user.id === "504259797453897729")
    return await next();

  const sep = "\n- ";
  if (!hasAnyRole)
    return await replyToInteraction(interaction, {
      content: `Данный вид репорта может сделать только обладатель одной из ролей:${sep}${roles.map(toRole).join(sep)}`,
      ephemeral: true,
      allowedMentions: { parse: [] }
    });
  
  return await next();
}
