import { dirname, importx } from "@discordx/importer";
import type { Interaction, Message } from "discord.js";
import { IntentsBitField } from "discord.js";
import { Client } from "discordx";
import { config } from "dotenv";
import { Octokit } from "@octokit/rest";
import { shared } from "./shared.js";
config();

export const bot = new Client({
  // To use only guild command
  botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],

  // Discord intents
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageReactions,
    // IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.MessageContent,
  ],

  // Debug logs are disabled in silent mode
  silent: process.env["NODE_ENV"] == "production",

  // Configuration for @SimpleCommand
  simpleCommand: {
    prefix: "sb-",
  },
});

bot.once("ready", async () => {
  // Make sure all guilds are cached
  await bot.guilds.fetch();

  // Synchronize applications commands with Discord
  await bot.initApplicationCommands();

  // To clear all guild commands, uncomment this line,
  // This is useful when moving from guild commands to global commands
  // It must only be executed once
  //
  //  await bot.clearApplicationCommands(
  //    ...bot.guilds.cache.map((g) => g.id)
  //  );

  console.log("Bot started");
});

bot.on("interactionCreate", (interaction: Interaction) => {
  bot.executeInteraction(interaction);
});

bot.on("messageCreate", (message: Message) => {
  bot.executeCommand(message);
});

async function run() {
  // The following syntax should be used in the commonjs environment
  //
  // await importx(__dirname + "/{events,commands}/**/*.{ts,js}");

  // The following syntax should be used in the ECMAScript environment
  await importx(`${dirname(import.meta.url)}/{events,commands}/**/*.{ts,js}`);

  // Let's start the bot
  if (!process.env["BOT_TOKEN"])
    throw Error("Could not find BOT_TOKEN in your environment");
  
  if (!process.env["GIT_TOKEN"])
    throw Error("Could not find GIT_TOKEN in your environment");

  if (!process.env["REPORT_GUILD"])
    throw Error("Could not find REPORT_GUILD in your environment")

  if (!process.env["REPORT_CHANNEL"])
    throw Error("Could not find REPORT_CHANNEL in your environment")
    
  if (!process.env["REPORT_REPO"])
    throw Error("Could not find REPORT_REPO in your environment")

  shared.octokit = new Octokit({
    auth: process.env["GIT_TOKEN"]
  });

  // Log in with your bot token
  await bot.login(process.env["BOT_TOKEN"]);
}

run();
