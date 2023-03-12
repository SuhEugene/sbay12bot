import { BaseInteraction, MessageCreateOptions, MessagePayload, TextChannel } from "discord.js";

export async function sendToReportsChannel(interaction: BaseInteraction, options: string | MessagePayload | MessageCreateOptions) {
  const bot = interaction.client;

  if (!process.env["REPORT_GUILD"])
    throw Error("Could not find REPORT_GUILD in your environment")

  if (!process.env["REPORT_CHANNEL"])
    throw Error("Could not find REPORT_CHANNEL in your environment")

  const guild = await bot.guilds.fetch(process.env["REPORT_GUILD"]);
  const channel = await guild.channels.fetch(process.env["REPORT_CHANNEL"]) as TextChannel;

  channel.send(options)
}