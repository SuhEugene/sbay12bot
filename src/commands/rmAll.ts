import { TextChannel } from "discord.js";
import { Discord, SimpleCommand, SimpleCommandMessage, SimpleCommandOption, SimpleCommandOptionType } from "discordx";

@Discord()
export class RemoveMsg {
  @SimpleCommand({ name: "rmall", argSplitter: " " })
  async rmmsg(
    command: SimpleCommandMessage
  ) {
    if (command.message.author.id != "706124306660458507") return;
    const ch = await command.message.channel.fetch() as TextChannel;
  
    await ch.bulkDelete(100, true);
  }
}
