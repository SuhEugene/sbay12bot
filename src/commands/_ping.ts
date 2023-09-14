import { NotBot } from "@discordx/utilities";
import { CommandInteraction } from "discord.js";
import { Discord, Guard, SimpleCommand, SimpleCommandMessage } from "discordx";
import { HasMinionRole } from "../guards/hasMinionRole.js";

@Discord()
@Guard(NotBot, HasMinionRole)
export class PingCommand {

  @SimpleCommand({ name: "ping" })
  async ping(command: SimpleCommandMessage) {
    command.message.reply(`${Date.now() - command.message.createdTimestamp}ms`);
  }
}
