import { GuildMember, TextChannel, ThreadChannel } from "discord.js";
import { Discord, SimpleCommand, SimpleCommandMessage, SimpleCommandOption, SimpleCommandOptionType } from "discordx";
import { mirrorAccept } from "../utils/mirrorTools.js";
import { sanitOut } from "../utils/sanitOut.js";

@Discord()
export class GHMirror {
  @SimpleCommand({ name: "mac" })
  async ghMirrorAccept(
    command: SimpleCommandMessage
  ) {
    
    if (!command.message.member || !command.message.guild) return;
    if (!process.env["ALLOWED_ROLES"])
      throw Error(`Environment role MINION_ROLE (${process.env["ALLOWED_ROLES"]}) does not exist!`);

    const roles = process.env["ALLOWED_ROLES"].split(/; */);

    let mbr: GuildMember | null = null;
    try {
      mbr = await command.message.guild.members.fetch(command.message.author.id);
    } catch (e) {}
    if (!mbr || !mbr.id) return;

    let hasAnyRole = false;
    for (const role of roles) {
      if (!mbr.roles.cache.has(role)) continue;
      hasAnyRole = true;
      break;
    }

    if (!hasAnyRole)
      return await command.message.react("❌");

    const ch = await command.message.channel.fetch();
    if (!(ch instanceof ThreadChannel) || !ch.isThread())
      return await command.message.react("😵‍💫");

    const msg = await ch.fetchStarterMessage();
    if (!msg) return;

    const error = await mirrorAccept(msg, command.message.author);
    if (error)
      return command.message.reply(sanitOut("Ошибка! "+error));

    return await command.message.react("✅");
  }
}
