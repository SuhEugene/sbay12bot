import { TextChannel } from "discord.js";
import { Discord, SimpleCommand, SimpleCommandMessage } from "discordx";
import { bot } from "../main.js"
@Discord()
export class RemoveMsg {
  @SimpleCommand({ name: "rmall", argSplitter: " " })
  async rmmsg(
    command: SimpleCommandMessage
  ) {
    if (command.message.author.id != "706124306660458507") return;
    console.log("Cleaning ", command.message.channel.id);
    const ch = await command.message.channel.fetch() as TextChannel;
  
    const msgs = (await ch.messages.fetch({ limit: 100 })).filter(msg => msg.author.id == bot.user?.id);
    msgs.forEach(async msg => {
      if(msg.deletable) await msg.delete();
    });
  }
}
