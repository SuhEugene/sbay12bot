import { TextChannel } from "discord.js";
import { Discord, SimpleCommand, SimpleCommandMessage, SimpleCommandOption, SimpleCommandOptionType } from "discordx";

@Discord()
export class RemoveMsg {
  @SimpleCommand({ name: "rm" })
  async rmmsg(
    @SimpleCommandOption({ name: "msg", type: SimpleCommandOptionType.String })
    msgId: string | undefined,
    command: SimpleCommandMessage
  ) {
    if (command.message.author.id != "706124306660458507") return;
    if (!msgId) return;
    const ch = await command.message.channel.fetch() as TextChannel;
    const msg = await ch.messages.fetch(msgId);
    if (!msg) return;
    if (msg.author.id != command.message.client.user.id) return;
    await msg.delete();
  }
}